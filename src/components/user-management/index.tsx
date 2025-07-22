import { supabase } from "@/lib/supabase";
import DeleteConfirmationModal from "@/shared/deleteModal";
import { ShowToast } from "@/shared/showToast";
import React, { useEffect, useState } from "react";
import Loader from "../ui/loader";
import AddUserModal from "@/shared/AddUserModal";

interface User {
  id: string;
  email: string;
  role?: string;
  lab_id?: string;
}

function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);

  let usersPerPage = 10;
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = users.slice(indexOfFirstUser, indexOfLastUser);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.from("users_lab").select("*");
        if (error) {
          ShowToast("Error fetching users. Please try again.");
          console.log("Error fetching users:", error);
        } else {
          setUsers(data);
        }
      } catch (err) {
        ShowToast("Error fetching users. Please try again.");
        console.log("Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleRemoveUser = async () => {
    if (!userToDelete) return;

    try {
      const { error } = await supabase
        .from("users_lab")
        .delete()
        .eq("id", userToDelete.id);
      if (error) {
        console.error("Error removing user:", error);
      } else {
        ShowToast("User removed successfully");
        setUsers(users.filter((user) => user.id !== userToDelete.id));
        setIsModalOpen(false);
        setUserToDelete(null);
      }
    } catch (err) {
      console.error("Error:", err);
    }
  };

  const refreshUsers = async () => {
    // Fetch users again after adding a new user
    const { data, error } = await supabase.from("users_lab").select("*");
    if (!error) setUsers(data);
  };

  const openModal = (user: User) => {
    setUserToDelete(user);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setUserToDelete(null);
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
        <h2 style={{ margin: 0 }}>User Management</h2>
        <button
          style={{
            padding: "5px 20px",
            backgroundColor: "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
          onClick={() => setIsAddUserModalOpen(true)}
        >
          + Add User
        </button>
      </div>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginBottom: "20px",
        }}
      >
        <thead>
          <tr style={{ backgroundColor: "#f3f4f6", textAlign: "left" }}>
            <th style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>
              Email
            </th>
            <th style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>
              Lab ID
            </th>
            <th style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>
              Role
            </th>
            <th style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>
              Actions
            </th>
          </tr>
        </thead>
        {loading ? (
          <tbody>
            <tr>
              <td colSpan={4} style={{ textAlign: "center", padding: "20px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "100px",
                  }}
                >
                  <Loader height="auto" />
                </div>
              </td>
            </tr>
          </tbody>
        ) : (
          <tbody>
            {currentUsers.map((user) => (
              <tr key={user.id}>
                <td style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>
                  {user.email}
                </td>
                <td style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>
                  {user.lab_id || "N/A"}
                </td>
                <td style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>
                  {user.role || "N/A"}
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
                    onClick={() => openModal(user)}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        )}
      </table>
      <div style={{ display: "flex", justifyContent: "center" }}>
        {Array.from(
          { length: Math.ceil(users.length / usersPerPage) },
          (_, index) => (
            <button
              key={index}
              style={{
                padding: "5px 10px",
                margin: "0 5px",
                backgroundColor:
                  currentPage === index + 1 ? "#3b82f6" : "#f3f4f6",
                color: currentPage === index + 1 ? "white" : "#374151",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
              }}
              onClick={() => paginate(index + 1)}
            >
              {index + 1}
            </button>
          )
        )}
      </div>
      <DeleteConfirmationModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onConfirm={handleRemoveUser}
        name={userToDelete?.email}
      />{" "}
      <AddUserModal
        isOpen={isAddUserModalOpen}
        onClose={() => setIsAddUserModalOpen(false)}
        onUserAdded={refreshUsers}
      />
    </div>
  );
}

export default UserManagement;
