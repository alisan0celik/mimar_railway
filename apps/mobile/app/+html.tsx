import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

const BACKGROUND = "#0B1120";

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="tr">
      <head>
        <meta charSet="utf-8" />
        <meta content="IE=edge" httpEquiv="X-UA-Compatible" />
        <meta
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
          name="viewport"
        />
        <meta content={BACKGROUND} name="theme-color" />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              html, body, #root {
                background-color: ${BACKGROUND} !important;
                min-height: 100%;
              }
              body { margin: 0; }
            `,
          }}
        />
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
