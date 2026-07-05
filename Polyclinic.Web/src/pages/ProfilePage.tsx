import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { usersApi } from '../api/usersApi';
import type { UserProfileDto } from '../api/usersApi';
import { getErrorMessage } from '../utils/errorUtils';
import type { InsuranceCardDto } from '../types/insuranceCard';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { useUIContext } from '../hooks/UIContext';


const profileSchema = z.object({
  firstName: z.string().min(2, 'Prenumele trebuie să aibă cel puțin 2 caractere'),
  lastName: z.string().min(2, 'Numele trebuie să aibă cel puțin 2 caractere'),
  phone: z.string().regex(/^(\+40|0)[0-9]{9}$/, 'Număr de telefon invalid').optional().or(z.literal('')),
  address: z.string().optional(),
  city: z.string().optional(),
  county: z.string().optional(),
  gender: z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Introduceți parola curentă'),
  newPassword: z.string()
    .min(8, 'Parola trebuie să aibă cel puțin 8 caractere')
    .regex(/[A-Z]/, 'Parola trebuie să conțină cel puțin o literă mare')
    .regex(/[^a-zA-Z0-9]/, 'Parola trebuie să conțină cel puțin un caracter special'),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Parolele nu coincid',
  path: ['confirmPassword'],
});

const cardSchema = z.object({
  firstName: z.string().min(2, 'Prenumele este obligatoriu'),
  lastName: z.string().min(2, 'Numele este obligatoriu'),
  insuredCode: z.string().min(1, 'Codul asiguratului este obligatoriu'),
  documentNumber: z.string().min(1, 'Numărul documentului este obligatoriu'),
  expiryDate: z.string().min(1, 'Data expirării este obligatorie'),
});

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;
type CardForm = z.infer<typeof cardSchema>;

const inp: React.CSSProperties = {
  width: '100%', padding: '9px 12px',
  border: '0.5px solid var(--color-border-tertiary)',
  borderRadius: 'var(--border-radius-md)',
  fontSize: '13px', color: 'var(--color-text-primary)',
  background: 'white', boxSizing: 'border-box', outline: 'none',
};

const lbl: React.CSSProperties = {
  display: 'block', fontSize: '12px',
  color: 'var(--color-text-secondary)', marginBottom: '5px',
};

const errMsg = (msg?: string) => msg ? (
  <p style={{ fontSize: '11px', color: '#E24B4A', marginTop: '3px' }}>{msg}</p>
) : null;

const inpErr = (hasError: boolean): React.CSSProperties => ({
  ...inp, borderColor: hasError ? '#E24B4A' : 'var(--color-border-tertiary)',
});

export default function ProfilePage() {
  const navigate = useNavigate();
  const { clearAuth } = useAuthStore();
  const [profile, setProfile] = useState<UserProfileDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();
  const [insuranceCards, setInsuranceCards] = useState<InsuranceCardDto[]>([]);
  const [showCardForm, setShowCardForm] = useState(false);
  const [pendingPicture, setPendingPicture] = useState<File | null>(null);
  const [pendingPicturePreview, setPendingPicturePreview] = useState<string | null>(null);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    mode: 'onChange',
  });
  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    mode: 'onChange',
  });
  const cardForm = useForm<CardForm>({
    resolver: zodResolver(cardSchema),
    mode: 'onChange',
  });
  const {toast, confirm} = useUIContext();

  useEffect(() => {
    const fetch = async () => {
      try {
        const [profileRes, cardsRes] = await Promise.all([
          usersApi.getProfile(),
          usersApi.getInsuranceCards(),
        ]);
        setProfile(profileRes.data);
        setInsuranceCards(cardsRes.data);
        profileForm.reset({
          firstName: profileRes.data.firstName,
          lastName: profileRes.data.lastName,
          phone: profileRes.data.phone ?? '',
          address: profileRes.data.address ?? '',
          city: profileRes.data.city ?? '',
          county: profileRes.data.county ?? '',
          gender: profileRes.data.gender ?? '',
        });
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const onUpdateProfile = async (data: ProfileForm) => {
    setSaving(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const response = await usersApi.updateProfile(data);
      setProfile(response.data);
      if (pendingPicture) {
        const picRes = await usersApi.uploadProfilePicture(pendingPicture);
        setProfile(prev => prev ? { ...prev, profilePictureUrl: picRes.data.profilePictureUrl } : prev);
        setPendingPicture(null);
        setPendingPicturePreview(null);
      }
      toast('Profilul a fost actualizat cu succes', 'success');
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  const onChangePassword = async (data: PasswordForm) => {
    setChangingPassword(true);
    setError(null);
    setSuccessMessage(null);
    try {
      await usersApi.changePassword({ currentPassword: data.currentPassword, newPassword: data.newPassword });
      toast('Parola a fost schimbată cu succes', 'success');
      passwordForm.reset();
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setChangingPassword(false);
    }
  };

  const onAddCard = async (data: CardForm) => {
    try {
      const response = await usersApi.addInsuranceCard(data);
      setInsuranceCards([...insuranceCards, response.data]);
      setShowCardForm(false);
      cardForm.reset();
      toast('Card adăugat cu succes', 'success');
    } catch (err) {
      toast(getErrorMessage(err), 'error');

    }
  };

  const handleRemoveCard = async (id: string) => {
    const ok = await confirm({ title: 'Ștergere card CNAS', message: 'Ești sigur că vrei să ștergi cardul CNAS?', confirmLabel: 'Șterge', variant: 'danger' });
    if (!ok) return;
    
    try {
      await usersApi.removeInsuranceCard(id);
      setInsuranceCards(insuranceCards.filter(c => c.id !== id));
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    }
  };
  
  const handleDeleteAccount = async () => {
    const ok = await confirm({ title: 'Ștergere cont', message: 'Ești sigur că vrei să-ți ștergi contul?', confirmLabel: 'Șterge', variant: 'danger' });
    if (!ok) return;
    setDeletingAccount(true);
    try {
      await usersApi.deleteOwnAccount();
      clearAuth();
      navigate('/');
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    } finally {
      setDeletingAccount(false);
    }
  };

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--color-text-tertiary)' }}>
      Se încarcă...
    </div>
  );

  const card: React.CSSProperties = {
    background: 'white', border: '0.5px solid var(--color-border-tertiary)',
    borderRadius: 'var(--border-radius-lg)', padding: '24px', marginBottom: '16px',
  };

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '24px' }}>
        Profilul meu
      </h1>

      {successMessage && (
        <div style={{ background: 'var(--color-background-success)', color: 'var(--color-text-success)', padding: '10px 16px', borderRadius: 'var(--border-radius-md)', fontSize: '13px', marginBottom: '16px' }}>
          {successMessage}
        </div>
      )}
      {error && (
        <div style={{ background: 'var(--color-background-danger)', color: 'var(--color-text-danger)', padding: '10px 16px', borderRadius: 'var(--border-radius-md)', fontSize: '13px', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      {/* Avatar + info */}
      <div style={{ ...card, display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{ position: 'relative' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#E6F1FB', color: '#185FA5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 500, overflow: 'hidden', flexShrink: 0 }}>
            {pendingPicturePreview || profile?.profilePictureUrl ? (
              <img src={pendingPicturePreview ?? `http://localhost:5289${profile?.profilePictureUrl}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : `${profile?.firstName?.[0]}${profile?.lastName?.[0]}`}
          </div>
          
          {user?.role === 'doctor' && (
            <label style={{ position: 'absolute', bottom: 0, right: 0, width: '22px', height: '22px', borderRadius: '50%', background: '#378ADD', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '11px' }}>
              ✎
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) { setPendingPicture(f); setPendingPicturePreview(URL.createObjectURL(f)); } }} />
            </label>
          )}
        </div>
        <div>
          <p style={{ fontSize: '16px', fontWeight: 500, color: 'var(--color-text-primary)' }}>{profile?.firstName} {profile?.lastName}</p>
          <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>{profile?.email}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
            {profile?.emailVerified && (
              <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '99px', background: '#EAF3DE', color: '#3B6D11', fontWeight: 500 }}>
                Email verificat
              </span>
            )}
            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '99px', background: '#E6F1FB', color: '#185FA5', fontWeight: 500 }}>
              {user?.role}
            </span>
          </div>
        </div>
      </div>

      {/* Date personale */}
      <div style={card}>
        <h2 style={{ fontSize: '15px', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '16px' }}>Date personale</h2>
        <form onSubmit={profileForm.handleSubmit(onUpdateProfile)}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={lbl}>Prenume</label>
              <input {...profileForm.register('firstName')} style={inpErr(!!profileForm.formState.errors.firstName)} />
              {errMsg(profileForm.formState.errors.firstName?.message)}
            </div>
            <div>
              <label style={lbl}>Nume</label>
              <input {...profileForm.register('lastName')} style={inpErr(!!profileForm.formState.errors.lastName)} />
              {errMsg(profileForm.formState.errors.lastName?.message)}
            </div>
            {profile?.cnp && (
              <div style={{ marginBottom: '12px' }}>
                <label style={lbl}>CNP</label>
                <div style={{
                  ...inp,
                  background: 'var(--color-background-secondary)',
                  color: 'var(--color-text-secondary)',
                  cursor: 'not-allowed',
                }}>
                  {profile.cnp}
                </div>
              </div>
            )}
            <div>
              <label style={lbl}>Telefon</label>
              <input {...profileForm.register('phone')} type="tel" style={inpErr(!!profileForm.formState.errors.phone)} />
              {errMsg(profileForm.formState.errors.phone?.message)}
            </div>
            <div>
              <label style={lbl}>Gen</label>
              <select {...profileForm.register('gender')} style={{ ...inp, cursor: 'pointer' }}>
                <option value="">Selectează...</option>
                <option value="male">Masculin</option>
                <option value="female">Feminin</option>
              </select>
            </div>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={lbl}>Adresă</label>
            <input {...profileForm.register('address')} style={inp} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={lbl}>Oraș</label>
              <input {...profileForm.register('city')} style={inp} />
            </div>
            <div>
              <label style={lbl}>Județ</label>
              <input {...profileForm.register('county')} style={inp} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '12px', borderTop: '0.5px solid var(--color-border-tertiary)' }}>
            <button type="submit" disabled={saving} style={{ background: '#378ADD', color: 'white', border: 'none', padding: '9px 20px', borderRadius: 'var(--border-radius-md)', fontSize: '13px', fontWeight: 500, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Se salvează...' : 'Salvează modificările'}
            </button>
          </div>
        </form>
      </div>

      {/* Schimbare parolă */}
      <div style={card}>
        <h2 style={{ fontSize: '15px', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '16px' }}>Schimbă parola</h2>
        <form onSubmit={passwordForm.handleSubmit(onChangePassword)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={lbl}>Parola curentă</label>
              <input {...passwordForm.register('currentPassword')} type="password" placeholder="••••••••" style={inpErr(!!passwordForm.formState.errors.currentPassword)} />
              {errMsg(passwordForm.formState.errors.currentPassword?.message)}
            </div>
            <div>
              <label style={lbl}>Parola nouă</label>
              <input {...passwordForm.register('newPassword')} type="password" placeholder="••••••••" style={inpErr(!!passwordForm.formState.errors.newPassword)} />
              {errMsg(passwordForm.formState.errors.newPassword?.message)}
            </div>
            <div>
              <label style={lbl}>Confirmă parola nouă</label>
              <input {...passwordForm.register('confirmPassword')} type="password" placeholder="••••••••" style={inpErr(!!passwordForm.formState.errors.confirmPassword)} />
              {errMsg(passwordForm.formState.errors.confirmPassword?.message)}
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '12px', borderTop: '0.5px solid var(--color-border-tertiary)' }}>
            <button type="submit" disabled={changingPassword} style={{ background: '#1a1a1a', color: 'white', border: 'none', padding: '9px 20px', borderRadius: 'var(--border-radius-md)', fontSize: '13px', fontWeight: 500, cursor: 'pointer', opacity: changingPassword ? 0.6 : 1 }}>
              {changingPassword ? 'Se schimbă...' : 'Schimbă parola'}
            </button>
          </div>
        </form>
      </div>

      {/* Card CNAS */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 500, color: 'var(--color-text-primary)' }}>Card de sănătate CNAS</h2>
          {insuranceCards.length === 0 && (
            <button onClick={() => setShowCardForm(!showCardForm)} style={{ background: 'none', border: 'none', fontSize: '13px', color: '#378ADD', cursor: 'pointer' }}>
              + Adaugă card
            </button>
          )}
        </div>

        {showCardForm && (
          <form onSubmit={cardForm.handleSubmit(onAddCard)} style={{ background: 'var(--color-background-secondary)', borderRadius: 'var(--border-radius-md)', padding: '16px', marginBottom: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={lbl}>Prenume</label>
                <input {...cardForm.register('firstName')} style={inpErr(!!cardForm.formState.errors.firstName)} />
                {errMsg(cardForm.formState.errors.firstName?.message)}
              </div>
              <div>
                <label style={lbl}>Nume</label>
                <input {...cardForm.register('lastName')} style={inpErr(!!cardForm.formState.errors.lastName)} />
                {errMsg(cardForm.formState.errors.lastName?.message)}
              </div>
              <div>
                <label style={lbl}>Cod asigurat</label>
                <input {...cardForm.register('insuredCode')} style={inpErr(!!cardForm.formState.errors.insuredCode)} />
                {errMsg(cardForm.formState.errors.insuredCode?.message)}
              </div>
              <div>
                <label style={lbl}>Număr document</label>
                <input {...cardForm.register('documentNumber')} style={inpErr(!!cardForm.formState.errors.documentNumber)} />
                {errMsg(cardForm.formState.errors.documentNumber?.message)}
              </div>
              <div>
                <label style={lbl}>Data expirării</label>
                <input {...cardForm.register('expiryDate')} type="date" style={inpErr(!!cardForm.formState.errors.expiryDate)} />
                {errMsg(cardForm.formState.errors.expiryDate?.message)}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="submit" style={{ background: '#378ADD', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 'var(--border-radius-md)', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
                Salvează
              </button>
              <button type="button" onClick={() => { setShowCardForm(false); cardForm.reset(); }} style={{ background: 'none', border: 'none', fontSize: '13px', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
                Anulează
              </button>
            </div>
          </form>
        )}

        {insuranceCards.length === 0 ? (
          <p style={{ fontSize: '13px', color: 'var(--color-text-tertiary)' }}>Nu ai niciun card de sănătate adăugat</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {insuranceCards.map(c => (
              <div key={c.id} style={{ border: `0.5px solid ${c.isValid ? '#9FE1CB' : '#F09595'}`, borderRadius: 'var(--border-radius-md)', padding: '14px', background: c.isValid ? '#E1F5EE' : '#FCEBEB' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)' }}>{c.firstName} {c.lastName}</p>
                      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '99px', fontWeight: 500, background: !c.isValid ? '#F7C1C1' : c.isVerified ? '#C0DD97' : '#FAC775', color: !c.isValid ? '#791F1F' : c.isVerified ? '#27500A' : '#633806' }}>
                        {!c.isValid ? 'Expirat' : c.isVerified ? 'Verificat' : 'În așteptare'}
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Cod asigurat: {c.insuredCode}</p>
                    <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Nr. document: {c.documentNumber}</p>
                    <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Expiră: {c.expiryDate}</p>
                  </div>
                  <button onClick={() => handleRemoveCard(c.id)} style={{ background: 'none', border: 'none', fontSize: '13px', color: '#A32D2D', cursor: 'pointer' }}>
                    Șterge
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div style={{
          ...card,
          border: '0.5px solid #F09595',
        }}>
          <h2 style={{ fontSize: '15px', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '8px' }}>
            Zonă periculoasă
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
            Ștergerea contului este permanentă. Toate datele tale vor fi dezactivate.
          </p>
          <button
            onClick={handleDeleteAccount}
            disabled={deletingAccount}
            style={{
              padding: '9px 20px', background: 'none',
              border: '0.5px solid var(--color-text-danger)',
              borderRadius: 'var(--border-radius-md)',
              fontSize: '13px', color: 'var(--color-text-danger)',
              cursor: 'pointer', opacity: deletingAccount ? 0.6 : 1,
            }}
          >
            {deletingAccount ? 'Se procesează...' : 'Șterge contul'}
          </button>
        </div>
    </div>
  );
}