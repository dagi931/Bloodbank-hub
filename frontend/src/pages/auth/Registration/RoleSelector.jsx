import React from 'react';
import SelectDropdown from '../../../components/common/SelectDropdown';

export default function RoleSelector({ role, setRole, setError, setSuccessMsg }) {
  const handleRoleChange = (value) => {
    setRole(value);
    setError(null);
    setSuccessMsg(null);
  };

  return (
    <div className="register-role-selector">
      <label className="register-label">
        Registering As
      </label>

      <SelectDropdown
        value={role}
        onChange={handleRoleChange}
        ariaLabel="Registering As"
        options={[
          { value: 'donor', label: 'Donor (Requires Email Code)' },
          { value: 'station', label: 'Donation Station (Staff)' },
          { value: 'laboratory', label: 'Medical Screening Lab (Staff)' },
          { value: 'warehouse', label: 'Blood Central Inventory / Warehouse (Staff)' },
          { value: 'hospital', label: 'Hospital Workstation (Staff)' }
        ]}
      />
    </div>
  );
}
