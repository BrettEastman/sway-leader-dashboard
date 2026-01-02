import { ImageResponse } from "next/og";

// Image metadata
export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

// Image generation
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "transparent",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M2.352 0L33.9814 1.55354e-05C35.4431 1.55409e-05 36.1609 1.81932 35.108 2.85566L25.4403 12.3713C24.9867 12.8177 25.3339 13.5989 25.9612 13.5435L33.722 12.8581C34.4809 12.7911 35.1332 13.4026 35.1332 14.1811V37.5957C35.1332 38.9233 34.0803 39.9994 32.7812 39.9994H3.41192C1.21675 39.9994 0.139022 37.2673 1.72041 35.7112L18.8701 18.8362C19.3237 18.3898 18.9766 17.6084 18.3492 17.6639L3.52798 18.9728C1.6307 19.1405 -8.3242e-08 17.6117 0 15.6653L5.67171e-07 2.40385C6.23952e-07 1.07624 1.05303 -1.70149e-06 2.352 0Z"
            fill="black"
          />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}
