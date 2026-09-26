import { config } from '../config/index.js';
import { WeatherServiceError } from '../errors/index.js';
import type { Location } from '../models/equipment.model.js';

export interface CurrentWeather {
  temperature_2m?: number;
  precipitation?: number;
  wind_speed_10m?: number;
  weather_code?: number;
}

export interface OutdoorWorkWindow {
  suitable: boolean;
  reasons: string[];
  thresholds: { maxWindKmh: number };
}

export interface WeatherForecast {
  location: Location;
  current: CurrentWeather;
  outdoorWorkWindow: OutdoorWorkWindow;
}

export async function fetchCurrentWeather(lat: number, lon: number): Promise<CurrentWeather> {
  const url = new URL(config.weather.apiUrl);
  url.searchParams.set('latitude', String(lat));
  url.searchParams.set('longitude', String(lon));
  url.searchParams.set('current', 'temperature_2m,precipitation,wind_speed_10m,weather_code');
  url.searchParams.set('wind_speed_unit', 'kmh');
  url.searchParams.set('timezone', 'auto');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.weather.requestTimeoutMs);

  let response: Response;
  try {
    response = await fetch(url, { signal: controller.signal });
  } catch (err) {
    throw new WeatherServiceError(
      err instanceof Error && err.name === 'AbortError'
        ? 'Превышено время ожидания ответа от погодного сервиса'
        : 'Не удалось обратиться к погодному сервису',
      err,
    );
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new WeatherServiceError(`Погодный сервис ответил статусом ${response.status}`);
  }

  let payload: { current?: CurrentWeather };
  try {
    payload = (await response.json()) as { current?: CurrentWeather };
  } catch (err) {
    throw new WeatherServiceError('Погодный сервис вернул некорректный ответ', err);
  }

  if (!payload.current) {
    throw new WeatherServiceError('Погодный сервис вернул ответ без текущих данных');
  }

  return payload.current;
}

/**
 * Правило пригодности окна для наружных работ (задаётся в конфигурации, см. README):
 * отсутствие осадков и скорость ветра ниже порога WEATHER_MAX_WIND_KMH.
 */
export function assessOutdoorWorkWindow(current: CurrentWeather): OutdoorWorkWindow {
  const precipitation = current.precipitation ?? 0;
  const windSpeed = current.wind_speed_10m ?? 0;

  const noPrecipitation = precipitation <= 0;
  const windBelowThreshold = windSpeed < config.weather.maxWindKmh;

  return {
    suitable: noPrecipitation && windBelowThreshold,
    reasons: [
      ...(noPrecipitation ? [] : [`осадки: ${precipitation} мм`]),
      ...(windBelowThreshold
        ? []
        : [`скорость ветра ${windSpeed} км/ч превышает порог ${config.weather.maxWindKmh} км/ч`]),
    ],
    thresholds: {
      maxWindKmh: config.weather.maxWindKmh,
    },
  };
}

export async function getForecastForLocation({ lat, lon }: Location): Promise<WeatherForecast> {
  const current = await fetchCurrentWeather(lat, lon);
  const suitability = assessOutdoorWorkWindow(current);

  return {
    location: { lat, lon },
    current,
    outdoorWorkWindow: suitability,
  };
}
