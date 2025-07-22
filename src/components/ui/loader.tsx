import React from "react";

function Loader({ height = "100vh" }: { height?: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: height || "100vh",
        backgroundColor: "#f8fafc",
      }}
    >
      <div className="spinner"></div>
      <style jsx>{`
        .spinner {
          width: 50px;
          height: 50px;
          border: 5px solid #e5e7eb;
          border-top: 5px solid #0f4735;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

export default Loader;
