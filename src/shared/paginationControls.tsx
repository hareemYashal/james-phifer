import React from "react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disableButtons?: boolean;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  disableButtons = false,
}) => {
  const renderPagination = () => {
    const paginationButtons = [];

    if (totalPages <= 5) {
      // Show all pages if total pages are 5 or less
      for (let i = 1; i <= totalPages; i++) {
        paginationButtons.push(
          <button
            key={i}
            style={{
              padding: "5px 10px",
              margin: "0 5px",
              backgroundColor: currentPage === i ? "#3b82f6" : "#f3f4f6",
              color: currentPage === i ? "white" : "#374151",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
            onClick={() => onPageChange(i)}
          >
            {i}
          </button>
        );
      }
    } else {
      // Show first page
      paginationButtons.push(
        <button
          key={1}
          style={{
            padding: "5px 10px",
            margin: "0 5px",
            backgroundColor: currentPage === 1 ? "#3b82f6" : "#f3f4f6",
            color: currentPage === 1 ? "white" : "#374151",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
          onClick={() => onPageChange(1)}
        >
          1
        </button>
      );

      if (currentPage > 3) {
        paginationButtons.push(
          <span
            key="start-ellipsis"
            style={{
              padding: "5px 10px",
              margin: "0 5px",
              color: "#6b7280",
            }}
          >
            ...
          </span>
        );
      }

      // Show current page and neighbors
      for (
        let i = Math.max(2, currentPage - 1);
        i <= Math.min(totalPages - 1, currentPage + 1);
        i++
      ) {
        paginationButtons.push(
          <button
            key={i}
            style={{
              padding: "5px 10px",
              margin: "0 5px",
              backgroundColor: currentPage === i ? "#3b82f6" : "#f3f4f6",
              color: currentPage === i ? "white" : "#374151",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
            onClick={() => onPageChange(i)}
          >
            {i}
          </button>
        );
      }

      if (currentPage < totalPages - 2) {
        paginationButtons.push(
          <span
            key="end-ellipsis"
            style={{
              padding: "5px 10px",
              margin: "0 5px",
              color: "#6b7280",
            }}
          >
            ...
          </span>
        );
      }

      // Show last page
      paginationButtons.push(
        <button
          key={totalPages}
          style={{
            padding: "5px 10px",
            margin: "0 5px",
            backgroundColor: currentPage === totalPages ? "#3b82f6" : "#f3f4f6",
            color: currentPage === totalPages ? "white" : "#374151",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
          onClick={() => onPageChange(totalPages)}
        >
          {totalPages}
        </button>
      );
    }

    return paginationButtons;
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: "20px",
      }}
    >
      <button
        key="prev"
        style={{
          padding: "5px 10px",
          margin: "0 5px",
          backgroundColor: currentPage === 1 ? "#d1d5db" : "#3b82f6",
          color: currentPage === 1 ? "#6b7280" : "#fff",
          border: "none",
          borderRadius: "5px",
          cursor: currentPage === 1 ? "not-allowed" : "pointer",
        }}
        onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
        disabled={disableButtons || currentPage === 1}
      >
        Prev
      </button>

      <div style={{ display: "flex", alignItems: "center" }}>
        {renderPagination()}
      </div>

      <button
        key="next"
        style={{
          padding: "5px 10px",
          margin: "0 5px",
          backgroundColor: currentPage === totalPages ? "#d1d5db" : "#3b82f6",
          color: currentPage === totalPages ? "#6b7280" : "#fff",
          border: "none",
          borderRadius: "5px",
          cursor: currentPage === totalPages ? "not-allowed" : "pointer",
        }}
        onClick={() =>
          currentPage < totalPages && onPageChange(currentPage + 1)
        }
        disabled={disableButtons || currentPage === totalPages}
      >
        Next
      </button>
    </div>
  );
};

export default Pagination;
