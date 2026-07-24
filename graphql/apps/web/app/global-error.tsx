'use client';

import * as Sentry from '@sentry/nextjs';

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  Sentry.captureException(error);
  return (
    <html>
      <body>
        <h1>500 - Internal Server Error</h1>
        <p>Something went wrong. Please try again later.</p>
      </body>
    </html>
  );
}
