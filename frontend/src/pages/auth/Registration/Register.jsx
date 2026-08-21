import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { api } from '../../../services/api';

import './Register.css';

import RoleSelector from './RoleSelector';
import DonorEmailStep from './DonorEmailStep';
import DonorCodeStep from './DonorCodeStep';
import DonorProfileStep from './DonorProfileStep';
import StaffRegistration from './StaffRegistration';
import BottomToast from '../../../components/common/BottomToast';

export default function Register({ onNavigateToLogin }) {
  const [role, setRole] = useState('donor');
  const [step, setStep] = useState(1);

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [entityName, setEntityName] = useState('');
  const [location, setLocation] = useState('');

  // Donor information
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('Male');
  const [address, setAddress] = useState('');
  const [bloodType, setBloodType] = useState('UNKNOWN');
  const [faydaId, setFaydaId] = useState('');

  const [faydaLinked, setFaydaLinked] = useState(false);
  const [faydaStatus, setFaydaStatus] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // --------------------------------
  // STEP 1: SEND VERIFICATION EMAIL
  // --------------------------------

  const handleSendEmail = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const data = await api.auth.registerVerifyEmail(email);

      setSuccessMsg(data.message);

      if (data.code) {
        console.log('[DEBUG] Verification Code:', data.code);
      }

      setStep(2);
    } catch (err) {
      setError(
        err.message ||
          'Failed to send verification code. Email may already be taken.'
      );
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------
  // STEP 2: VERIFY CODE
  // --------------------------------

  const handleVerifyCode = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError(null);

    try {
      const data = await api.auth.verifyCode(email, code);

      setSuccessMsg(data.message);
      setStep(3);
    } catch (err) {
      setError(err.message || 'Invalid or expired code.');
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------
  // RESEND VERIFICATION EMAIL
  // --------------------------------

  const handleResendCode = async () => {
    setError(null);
    setSuccessMsg(null);
    // Re-use the same send-email endpoint — it will generate a fresh code
    const data = await api.auth.registerVerifyEmail(email);
    if (data.code) {
      console.log('[DEBUG] Resent Verification Code:', data.code);
    }
    // Success message handled inside DonorCodeStep component
  };

  // --------------------------------
  // FAYDA LOOKUP
  // --------------------------------

  const handleFaydaLookup = async () => {
    if (!faydaId) {
      setError('Please enter a FAYDA ID first.');
      return;
    }

    setLoading(true);
    setError(null);
    setFaydaStatus(null);

    try {
      const data = await api.auth.faydaLookup(faydaId);

      setName(data.name);
      setPhone(data.phone);

      if (data.dob) {
        setDob(data.dob.split('T')[0]);
      }

      setGender(data.gender);
      setAddress(data.address);
      setBloodType(data.blood_type);

      setFaydaLinked(true);
      setFaydaStatus('success');

      setSuccessMsg(
        '✓ Profile successfully retrieved from FAYDA registry. Demographics auto-filled!'
      );
    } catch (err) {
      setError(
        err.message ||
          'FAYDA ID profile not found. Please fill in details manually.'
      );

      setFaydaLinked(false);
      setFaydaStatus('error');
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------
  // COMPLETE REGISTRATION
  // --------------------------------

  const handleRegisterComplete = async (e) => {
    e.preventDefault();

    // Validate confirm password
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please confirm your password.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setError(null);

    const payload = {
      email,
      password,
      role,

      entityName: role === 'donor' ? name : entityName,

      location: role !== 'donor' ? location : undefined,

      faydaId: role === 'donor' ? faydaId : undefined,

      name: role === 'donor' ? name : undefined,

      phone: role === 'donor' ? phone : undefined,

      dob: role === 'donor' ? dob : undefined,

      gender: role === 'donor' ? gender : undefined,

      address: role === 'donor' ? address : undefined,

      bloodType: role === 'donor' ? bloodType : undefined,
    };

    try {
      await api.auth.registerComplete(payload);

      setSuccessMsg(
        role === 'donor'
          ? '✓ Donor account created successfully! Redirecting to login...'
          : '✓ Workstation registered successfully! Please wait for Admin approval. Redirecting to login...'
      );

      setTimeout(() => {
        onNavigateToLogin();
      }, 2500);
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------
  // FAYDA ID CHANGE
  // --------------------------------

  const handleFaydaIdChange = (value) => {
    setFaydaId(value);

    if (!value) {
      setFaydaLinked(false);
      setFaydaStatus(null);
    }
  };

  // --------------------------------
  // HEADER DESCRIPTION
  // --------------------------------

  const getStepDescription = () => {
    if (role === 'donor' && step === 1) {
      return 'Step 1: Verify donor email address';
    }

    if (role === 'donor' && step === 2) {
      return 'Step 2: Enter verification code';
    }

    if (role === 'donor' && step === 3) {
      return 'Step 3: Setup donor demographics & password';
    }

    return 'Register your system workstation portal';
  };

  return (
    <div
      className={`register-container ${
        role === 'donor' && step === 3
          ? 'register-container-large'
          : 'register-container-small'
      }`}
    >
      {/* Header */}
      <div className="register-header">
        <h2>Workstation Registry</h2>
        <p>{getStepDescription()}</p>
      </div>

      {/* Error */}
      {error && (
        <div className="register-message register-error">
          {error}
        </div>
      )}

      {/* Floating Bottom Success Toast (Auto-dismisses in 5s) */}
      <BottomToast message={successMsg} onClose={() => setSuccessMsg(null)} />

      {/* Role Selector */}
      {step === 1 && (
        <RoleSelector
          role={role}
          setRole={setRole}
          setError={setError}
          setSuccessMsg={setSuccessMsg}
        />
      )}

      {/* Donor Step 1 */}
      {role === 'donor' && step === 1 && (
        <DonorEmailStep
          email={email}
          setEmail={setEmail}
          loading={loading}
          onSubmit={handleSendEmail}
        />
      )}

      {/* Donor Step 2 */}
      {role === 'donor' && step === 2 && (
        <DonorCodeStep
          email={email}
          code={code}
          setCode={setCode}
          loading={loading}
          onSubmit={handleVerifyCode}
          onBack={() => setStep(1)}
          onResend={handleResendCode}
        />
      )}

      {/* Donor Step 3 */}
      {role === 'donor' && step === 3 && (
        <DonorProfileStep
          password={password}
          setPassword={setPassword}
          confirmPassword={confirmPassword}
          setConfirmPassword={setConfirmPassword}
          faydaId={faydaId}
          setFaydaId={handleFaydaIdChange}
          faydaLinked={faydaLinked}
          faydaStatus={faydaStatus}
          onFaydaLookup={handleFaydaLookup}
          name={name}
          setName={setName}
          phone={phone}
          setPhone={setPhone}
          dob={dob}
          setDob={setDob}
          gender={gender}
          setGender={setGender}
          address={address}
          setAddress={setAddress}
          loading={loading}
          onSubmit={handleRegisterComplete}
        />
      )}

      {/* Staff Registration */}
      {role !== 'donor' && step === 1 && (
        <StaffRegistration
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          confirmPassword={confirmPassword}
          setConfirmPassword={setConfirmPassword}
          entityName={entityName}
          setEntityName={setEntityName}
          location={location}
          setLocation={setLocation}
          role={role}
          loading={loading}
          onSubmit={handleRegisterComplete}
        />
      )}

      {/* Footer */}
      <div className="register-footer">
        <button
          onClick={onNavigateToLogin}
          className="register-login-link"
        >
          <ArrowLeft size={14} />
          Back to Sign In
        </button>
      </div>
    </div>
  );
}