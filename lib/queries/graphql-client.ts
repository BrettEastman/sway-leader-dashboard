import { sanitizeErrorText } from "../utils";

export async function fetchSwayAPI<T>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const apiUrl = process.env.SWAY_API_URL;
  const jwtToken = process.env.SWAY_JWT;

  if (!apiUrl) {
    throw new Error("SWAY_API_URL is not defined in environment variables");
  }

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Sway API typically expects 'Bearer <token>' for JWTs
        ...(jwtToken ? { Authorization: `Bearer ${jwtToken}` } : {}),
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      const sanitizedErrorText = sanitizeErrorText(errorText);
      throw new Error(
        `Sway API request failed: ${response.status} ${response.statusText} - ${sanitizedErrorText}`
      );
    }

    const json = await response.json();

    if (json.errors) {
      console.error("GraphQL Errors:", JSON.stringify(json.errors, null, 2));
      const errorMessages = json.errors
        .map((e: { message: string; path?: unknown[] }) => {
          return `${e.message}${
            e.path ? ` (path: ${JSON.stringify(e.path)})` : ""
          }`;
        })
        .join(", ");
      throw new Error(`GraphQL Errors: ${errorMessages}`);
    }

    return json.data as T;
  } catch (error) {
    console.error("Error fetching from Sway API:", error);
    throw error;
  }
}
