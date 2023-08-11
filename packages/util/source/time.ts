export function coarse_time_from_minutes(x: number) {
  const minute_threshold = 15;
  const hour_threshold = 60;

  if (x <= 0) {
    return "(not recorded)";
  } else if (x < minute_threshold) {
    return "a few minutes";
  } else if (x < hour_threshold) {
    return `${x} minutes`;
  } else {
    return plural(
      Math.round(x / hour_threshold),
      (_) => "1 hour",
      (n) => `${n} hours`
    );
  }
}

export function days_diff(x: Date, y: Date) {
  const OneDay = 1000 * 60 * 60 * 24;
  const toDays = (x: Date) =>
    new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime() / OneDay;
  return Math.floor(toDays(x) - toDays(y));
}

export function date_time_string(x: Date) {
  return `${x.getFullYear()}-${(x.getMonth() + 1)
    .toString()
    .padStart(2, "0")}-${x.getDate().toString().padStart(2, "0")} ${x
    .getHours()
    .toString()
    .padStart(2, "0")}:${x.getMinutes().toString().padStart(2, "0")}:${x
    .getSeconds()
    .toString()
    .padStart(2, "0")}`;
}

export function relative_time(x: Date) {
  const units = [
    { unit: "second", limit: 1000 },
    { unit: "minute", limit: 60 },
    { unit: "hour", limit: 60 },
  ];
  let current = "millisecond";
  let diff = new Date().getTime() - x.getTime();
  for (const { unit, limit } of units) {
    if (diff >= limit) {
      diff = diff / limit;
      current = unit;
    } else {
      break;
    }
  }
  const suffix = Math.round(diff) === 1 ? current : current + "s";
  return `${Math.round(diff)} ${suffix} ago`;
}

export function fine_grained_relative_date(x: Date) {
  const days = days_diff(x, new Date());
  if (days < 0) {
    return date_time_string(x);
  } else if (days === 0) {
    return relative_time(x);
  } else if (days > 20) {
    return date_time_string(x);
  } else {
    return String(days);
  }
}

export function relative_date(x: Date | null) {
  if (x == null) {
    return "never";
  } else {
    const year = x.getFullYear();
    const month = x.getMonth();
    const date = x.getDate();
    const now = new Date();

    if (year < now.getFullYear()) {
      return plural(
        now.getFullYear() - year,
        (_) => "last year",
        (n) => `${n} years ago`
      );
    } else if (year === now.getFullYear() && month < now.getMonth()) {
      return plural(
        now.getMonth() - month,
        (_) => "last month",
        (n) => `${n} months ago`
      );
    } else if (
      year === now.getFullYear() &&
      month === now.getMonth() &&
      date <= now.getDate()
    ) {
      const d = now.getDate() - date;
      switch (d) {
        case 0:
          return "today";
        case 1:
          return "yesterday";
        default:
          return `${d} days ago`;
      }
    }
    return `during ${year}`;
  }
}

function plural(
  n: number,
  single: (_: string) => string,
  plural: (_: string) => string
) {
  if (n === 1) {
    return single(String(n));
  } else {
    return plural(String(n));
  }
}
