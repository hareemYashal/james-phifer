import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { ShowToast } from "./showToast";
import { X } from "lucide-react";

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserAdded: () => void;
}

const AddUserModal: React.FC<AddUserModalProps> = ({
  isOpen,
  onClose,
  onUserAdded,
}) => {
  const [labs, setLabs] = useState<{ lab_id: number; name: string }[]>([]);
  const [labId, setLabId] = useState<number | null>(null);
  const [email, setEmail] = useState<string>("");
  const [role, setRole] = useState<string>("User");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchLabs = async () => {
      try {
        const { data, error } = await supabase
          .from("labs")
          .select("lab_id, name");
        if (error) {
          console.error("Error fetching labs:", error);
        } else {
          setLabs(data);
        }
      } catch (err) {
        console.error("Error:", err);
      }
    };

    fetchLabs();
  }, []);

  const handleAddUser = async () => {
    if (!labId || !email || !role) {
      alert("Please fill all fields.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("users_lab")
        .insert([{ lab_id: labId, email, role }]);
      if (error) {
        console.log("Error adding user:", error);
        ShowToast(error.details || "Error adding user. Please try again.");
      } else {
        ShowToast("User added successfully!");
        setEmail("");
        setRole("User");
        setLabId(null);
        onUserAdded();
        onClose();
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail("");
    setRole("User");
    setLabId(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "8px",
          width: "400px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <h3 style={{ marginBottom: 0 }}>Add User</h3>
          <X onClick={handleClose} />
        </div>
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", marginBottom: "5px" }}>Lab</label>
          <select
            value={labId || ""}
            onChange={(e) => setLabId(Number(e.target.value))}
            style={{
              width: "100%",
              padding: "10px",
              border: "1px solid #ddd",
              borderRadius: "5px",
            }}
          >
            <option value="" disabled>
              Select a lab
            </option>
            {labs.map((lab) => (
              <option key={lab.lab_id} value={lab.lab_id}>
                {lab.name}
              </option>
            ))}
          </select>
        </div>
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", marginBottom: "5px" }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: "95%",
              padding: "10px",
              border: "1px solid #ddd",
              borderRadius: "5px",
            }}
          />
        </div>
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", marginBottom: "5px" }}>Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            style={{
              width: "100%",
              padding: "10px",
              border: "1px solid #ddd",
              borderRadius: "5px",
            }}
          >
            <option value="Admin">Admin</option>
            <option value="User">User</option>
          </select>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <button
            style={{
              padding: "10px 20px",
              backgroundColor: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
            onClick={handleAddUser}
            disabled={loading}
          >
            {loading ? "Adding..." : "Add"}
          </button>
          <button
            style={{
              padding: "10px 20px",
              backgroundColor: "#e5e7eb",
              color: "#374151",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
            onClick={handleClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddUserModal;
