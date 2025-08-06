import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import DeleteConfirmationModal from "@/shared/deleteModal";
import { ShowToast } from "@/shared/showToast";
import AddLabModal from "@/shared/AddLabModal";
import { useRouter } from "next/navigation";
import Loader from "../ui/loader";
import Pagination from "@/shared/paginationControls";

interface Lab {
  lab_id: number;
  name: string;
}

const LabManagement: React.FC = () => {
  const [labs, setLabs] = useState<Lab[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [labToDelete, setLabToDelete] = useState<Lab | null>(null);
  const [isAddLabModalOpen, setIsAddLabModalOpen] = useState(false);
  const router = useRouter();

  const [currentPage, setCurrentPage] = useState(1);
  const labsPerPage = 10;

  const indexOfLastLab = currentPage * labsPerPage;
  const indexOfFirstLab = indexOfLastLab - labsPerPage;
  const currentLabs = labs.slice(indexOfFirstLab, indexOfLastLab);

  useEffect(() => {
    const fetchLabs = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/labs", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (!response.ok) {
          const errorData = await response.json();
          ShowToast(errorData.error || "Error fetching labs. Please try again.");
          console.error("Error fetching labs:", errorData.error);
        } else {
          const data = await response.json();
          setLabs(data.labs || []);
        }
      } catch (err) {
        ShowToast("Error fetching labs. Please try again.");
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLabs();
  }, [router]);

  const handleRemoveLab = async () => {
    if (!labToDelete) return;
    setDeleteLoading(true);
    try {
      const response = await fetch("/api/labs", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ lab_id: labToDelete.lab_id }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        ShowToast(errorData.error || "Error removing lab. Please try again.");
        console.error("Error removing lab:", errorData.error);
      } else {
        ShowToast("Lab removed successfully");
        setLabs(labs.filter((lab) => lab.lab_id !== labToDelete.lab_id));
        setIsModalOpen(false);
        setLabToDelete(null);
      }
    } catch (err) {
      ShowToast("Error removing lab. Please try again.");
      console.error("Error:", err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const refreshLabs = async () => {
    try {
      const response = await fetch("/api/labs", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        ShowToast(errorData.error || "Error fetching labs. Please try again.");
        console.error("Error fetching labs:", errorData.error);
      } else {
        const data = await response.json();
        setLabs(data.labs || []);
      }
    } catch (err) {
      ShowToast("Error fetching labs. Please try again.");
      console.error("Error:", err);
    }
  };

  const openModal = (lab: Lab) => {
    setLabToDelete(lab);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setLabToDelete(null);
  };

  return (
    <div style={{ padding: "20px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "20px",
          padding: "10px",
        }}
      >
        <h2 style={{ margin: 0 }}>Lab Management</h2>
        <button
          style={{
            padding: "5px 20px",
            backgroundColor: "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
          onClick={() => setIsAddLabModalOpen(true)}
        >
          + Add Lab
        </button>
      </div>
      <table
        style={{
          width: "100%",
          borderCollapse: "separate",
          borderSpacing: "0",
          marginBottom: "20px",
          border: "1px solid #e5e7eb",
          borderRadius: "10px",
          boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
          overflow: "hidden",
        }}
      >
        <thead>
          <tr style={{ backgroundColor: "#f3f4f6", textAlign: "left" }}>
            <th style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>
              Lab ID
            </th>
            <th style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>
              Lab Name
            </th>
            <th style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>
              Actions
            </th>
          </tr>
        </thead>
        {loading ? (
          <tbody>
            <tr>
              <td colSpan={3} style={{ textAlign: "center", padding: "20px" }}>
                <Loader height="auto" />
              </td>
            </tr>
          </tbody>
        ) : (
          <tbody>
            {currentLabs.map((lab) => (
              <tr key={lab.lab_id}>
                <td style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>
                  {lab.lab_id}
                </td>
                <td style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>
                  {lab.name}
                </td>
                <td style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>
                  <button
                    style={{
                      padding: "5px 10px",
                      backgroundColor: "#f44336",
                      color: "white",
                      border: "none",
                      borderRadius: "5px",
                      cursor: "pointer",
                    }}
                    onClick={() => openModal(lab)}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        )}
      </table>

      {!loading && (
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(labs.length / labsPerPage)}
          onPageChange={(page) => setCurrentPage(page)}
          disableButtons={loading}
        />
      )}

      <DeleteConfirmationModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onConfirm={handleRemoveLab}
        name={labToDelete?.name}
        deleteLoading={deleteLoading}
      />
      <AddLabModal
        isOpen={isAddLabModalOpen}
        onClose={() => setIsAddLabModalOpen(false)}
        onLabAdded={refreshLabs}
      />
    </div>
  );
};

export default LabManagement;
