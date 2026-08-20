import React from 'react';

export default function RoleSelector({ role, setRole, setError, setSuccessMsg }) {
  const handleRoleChange = (e) => {
    setRole(e.target.value);
    setError(null);
    setSuccessMsg(null);
  };

  return (
    <div className="register-role-selector">
      <label className="register-label">
        Registering As
      </label>

      <select
        value={role}
        onChange={handleRoleChange}
        className="register-input"
      >
        <option value="donor">
          Donor (Requires Email Code)
        </option>

        <option value="station">
          Donation Station (Staff)
        </option>

        <option value="laboratory">
          Medical Screening Lab (Staff)
        </option>

        <option value="warehouse">
          Blood Central Inventory / Warehouse (Staff)
        </option>

        <option value="hospital">
          Hospital Workstation (Staff)
        </option>
      </select>
    </div>
  );
}