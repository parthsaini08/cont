import React, { useEffect, useState } from "react";
import { Pencil, Trash2, Save, X } from "lucide-react";
import { BASE_URL } from "../config";
const AdminPage = () => {
  const [users, setUsers] = useState([]);
  const [extensions, setExtensions] = useState([]);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
    agent_extension: "",
    lead_extension: "",
  });
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});

  // Fetch users
  const fetchUsers = async () => {
    const res = await fetch(`${BASE_URL}get_users.php`, {
      credentials: "include",
    });
    const data = await res.json();
    if (data.status === "success") setUsers(data.users);
  };

  // Fetch extensions.json
  const fetchExtensions = async () => {
    const res = await fetch("/extensions.json"); // keep in public/
    const data = await res.json();
    setExtensions(data);
  };

  useEffect(() => {
    fetchUsers();
    fetchExtensions();
  }, []);

  const handleAdd = async () => {
    const res = await fetch(`${BASE_URL}add_user.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (data.status === "success") {
      fetchUsers();
      setForm({
        name: "",
        email: "",
        password: "",
        role: "user",
        agent_extension: "",
        lead_extension: "",
      });
    } else alert(data.message);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this user?")) return;
    const res = await fetch(`${BASE_URL}delete_user.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ id }),
    });
    const data = await res.json();
    if (data.status === "success") fetchUsers();
    else alert(data.message);
  };

  const startEdit = (user) => {
    setEditId(user.id);
    setEditForm({ ...user });
  };

  const handleUpdate = async () => {
    const res = await fetch(`${BASE_URL}update_user.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(editForm),
    });
    const data = await res.json();
    if (data.status === "success") {
      fetchUsers();
      setEditId(null);
    } else alert(data.message);
  };

  return (
    <div className="min-h-screen p-4 md:p-6 bg-[#1e293b] text-gray-100">
  <h1 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6 text-white">
    Admin Dashboard: Manage Users
  </h1>

  {/* Add New User */}
  <div className="mb-6 p-4 bg-gray-800 rounded-lg shadow-md flex flex-col md:flex-row flex-wrap gap-2 md:gap-3 items-stretch md:items-center">
    <input
      placeholder="Name"
      value={form.name}
      onChange={(e) => setForm({ ...form, name: e.target.value })}
      className="px-3 py-2 rounded-md text-gray-900 flex-1"
    />
    <input
      placeholder="Email"
      value={form.email}
      onChange={(e) => setForm({ ...form, email: e.target.value })}
      className="px-3 py-2 rounded-md text-gray-900 flex-1"
    />
    <input
      type="password"
      placeholder="Password"
      value={form.password}
      onChange={(e) => setForm({ ...form, password: e.target.value })}
      className="px-3 py-2 rounded-md text-gray-900 flex-1"
    />

    {/* Agent Extension */}
    <select
      value={form.agent_extension}
      onChange={(e) => setForm({ ...form, agent_extension: e.target.value })}
      className="px-3 py-2 rounded-md text-gray-900 flex-1"
    >
      <option value="">Select Agent Name</option>
      {extensions.map((ext) => (
        <option key={ext.id} value={ext.id}>
          {ext.name} ({ext.type})
        </option>
      ))}
    </select>

    {/* Lead Extension */}
    <select
      value={form.lead_extension}
      onChange={(e) => setForm({ ...form, lead_extension: e.target.value })}
      className="px-3 py-2 rounded-md text-gray-900 flex-1"
    >
      <option value="">Select Lead Name</option>
      {extensions.map((ext) => (
        <option key={ext.id} value={ext.id}>
          {ext.name} ({ext.type})
        </option>
      ))}
    </select>

    <select
      value={form.role}
      onChange={(e) => setForm({ ...form, role: e.target.value })}
      className="px-3 py-2 rounded-md text-gray-900 flex-1"
    >
      <option value="admin">Admin</option>
      <option value="lead">Lead</option>
      <option value="user">User</option>
    </select>

    <button
      onClick={handleAdd}
      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md font-semibold transition w-full md:w-auto"
    >
      Add User
    </button>
  </div>

  {/* Users Table */}
  <div className="overflow-x-auto rounded-lg shadow-lg bg-gray-900">
    <table className="min-w-full table-auto text-left">
      <thead className="bg-gray-800 text-gray-300">
        <tr>
          <th className="px-3 py-2 text-sm md:text-base">ID</th>
          <th className="px-3 py-2 text-sm md:text-base">Name</th>
          <th className="px-3 py-2 text-sm md:text-base">Email</th>
          <th className="px-3 py-2 text-sm md:text-base">Role</th>
          <th className="px-3 py-2 text-sm md:text-base">Agent</th>
          <th className="px-3 py-2 text-sm md:text-base">Lead</th>
          <th className="px-3 py-2 text-sm md:text-base">Actions</th>
        </tr>
      </thead>
      <tbody>
        {users.map((u) => (
          <tr
            key={u.id}
            className="even:bg-gray-800 odd:bg-gray-700 hover:bg-gray-600 transition text-sm md:text-base"
          >
            <td className="px-3 py-2">{u.id}</td>
            <td className="px-3 py-2">
              {editId === u.id ? (
                <input
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                  className="px-2 py-1 rounded-md text-gray-900 w-full"
                />
              ) : (
                u.name
              )}
            </td>
            <td className="px-3 py-2">
              {editId === u.id ? (
                <input
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm({ ...editForm, email: e.target.value })
                  }
                  className="px-2 py-1 rounded-md text-gray-900 w-full"
                />
              ) : (
                u.email
              )}
            </td>
            <td className="px-3 py-2">
              {editId === u.id ? (
                <select
                  value={editForm.role}
                  onChange={(e) =>
                    setEditForm({ ...editForm, role: e.target.value })
                  }
                  className="px-2 py-1 rounded-md text-gray-900 w-full"
                >
                  <option value="admin">Admin</option>
                  <option value="lead">Lead</option>
                  <option value="user">User</option>
                </select>
              ) : (
                u.role
              )}
            </td>

            {/* Agent Name */}
            <td className="px-3 py-2">
              {editId === u.id ? (
                <select
                  value={editForm.agent_extension}
                  onChange={(e) =>
                    setEditForm({ ...editForm, agent_extension: e.target.value })
                  }
                  className="px-2 py-1 rounded-md text-gray-900 w-full"
                >
                  <option value="">Select Agent Name</option>
                  {extensions.map((ext) => (
                    <option key={ext.id} value={ext.id}>
                      {ext.name} ({ext.type})
                    </option>
                  ))}
                </select>
              ) : (
                extensions.find((ext) => ext.id == u.agent_extension)?.name ||
                u.agent_extension
              )}
            </td>

            {/* Lead Name */}
            <td className="px-3 py-2">
              {editId === u.id ? (
                <select
                  value={editForm.lead_extension}
                  onChange={(e) =>
                    setEditForm({ ...editForm, lead_extension: e.target.value })
                  }
                  className="px-2 py-1 rounded-md text-gray-900 w-full"
                >
                  <option value="">Select Lead Name</option>
                  {extensions.map((ext) => (
                    <option key={ext.id} value={ext.id}>
                      {ext.name} ({ext.type})
                    </option>
                  ))}
                </select>
              ) : (
                extensions.find((ext) => ext.id == u.lead_extension)?.name ||
                u.lead_extension
              )}
            </td>

            {/* Actions */}
            <td className="px-3 py-2 space-x-1 md:space-x-2 flex flex-wrap md:flex-nowrap">
              {editId === u.id ? (
                <>
                  <button
                    onClick={handleUpdate}
                    className="p-2 bg-green-600 hover:bg-green-700 rounded-md transition flex items-center justify-center"
                    title="Save"
                  >
                    <Save className="w-4 h-4 text-white" />
                  </button>
                  <button
                    onClick={() => setEditId(null)}
                    className="p-2 bg-gray-600 hover:bg-gray-700 rounded-md transition flex items-center justify-center"
                    title="Cancel"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => startEdit(u)}
                    className="p-2 bg-blue-600 hover:bg-blue-700 rounded-md transition flex items-center justify-center"
                    title="Edit"
                  >
                    <Pencil className="w-4 h-4 text-white" />
                  </button>
                  <button
                    onClick={() => handleDelete(u.id)}
                    className="p-2 bg-red-600 hover:bg-red-700 rounded-md transition flex items-center justify-center"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4 text-white" />
                  </button>
                </>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>

  );
};

export default AdminPage;
