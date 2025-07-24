import { supabase } from "@/lib/supabase";
import DeleteConfirmationModal from "@/shared/deleteModal";
import { ShowToast } from "@/shared/showToast";
import React, { useEffect, useState } from "react";
import Loader from "../ui/loader";
import AddUserModal from "@/shared/AddUserModal";
import { useRouter } from "next/navigation";
import { useUserContext } from "@/context/user-context";
import Pagination from "@/shared/paginationControls";

interface User {
  id: string;
  email: string;
  role?: string;
  lab_id?: string;
  labs?: any;
}

function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);

  let usersPerPage = 10;
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = users.slice(indexOfFirstUser, indexOfLastUser);
  const router = useRouter();
  const { user: currentUser } = useUserContext();

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("users_lab")
          .select("id, email, role, lab_id, labs(name)");

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
  }, [router]);

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
    const { data, error } = await supabase
      .from("users_lab")
      .select("id, email, role, lab_id, labs(name)");
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
              Email
            </th>
            <th style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>
              Lab Name
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
                  {user.labs?.name || user.labs?.[0]?.name || "N/A"}
                </td>
                <td style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>
                  {user.role || "N/A"}
                </td>
                <td style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>
                  <button
                    onClick={() => openModal(user)}
                    disabled={user.email === currentUser?.email}
                    style={{
                      padding: "5px 10px",
                      backgroundColor:
                        user.email === currentUser?.email
                          ? "#d1d5db"
                          : "#f44336",
                      color:
                        user.email === currentUser?.email ? "#6b7280" : "white",
                      border: "none",
                      borderRadius: "5px",
                      cursor:
                        user.email === currentUser?.email
                          ? "not-allowed"
                          : "pointer",
                    }}
                  >
                    {user.email === currentUser?.email
                      ? "Cannot Remove"
                      : "Remove"}
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
          totalPages={Math.ceil(users.length / usersPerPage)}
          onPageChange={(page) => setCurrentPage(page)}
          disableButtons={loading}
        />
      )}

      <DeleteConfirmationModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onConfirm={handleRemoveUser}
        name={userToDelete?.email}
      />
      <AddUserModal
        isOpen={isAddUserModalOpen}
        onClose={() => setIsAddUserModalOpen(false)}
        onUserAdded={refreshUsers}
      />
    </div>
  );
}

export default UserManagement;
