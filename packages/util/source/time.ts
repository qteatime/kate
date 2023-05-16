export function coarse_time(x: number) {
  const second_threshold = 1_000 * 60; // 1 minute
  const minute_threshold = 1_000 * 60 * 15; // 15 minutes
  const hour_threshold = 1_000 * 60 * 60; // 1 hour

  if (x < second_threshold) {
    return "a little while";
  } else if (x < minute_threshold) {
    return "a few minutes";
  } else if (x < hour_threshold) {
    return `${Math.round(x / (1_000 * 60))} minutes`;
  } else {
    return plural(
      Math.round(x / hour_threshold),
      (_) => "1 hour",
      (n) => `${n} hours`
    );
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
      date === now.getDate()
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
  if (n === 0) {
    return single(String(n));
  } else {
    return plural(String(n));
  }
}
