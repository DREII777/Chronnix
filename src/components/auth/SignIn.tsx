import { FormEvent, MutableRefObject, useMemo, useRef, useState } from 'react';
import logoUrl from '../../assets/logo.svg';
import { supabase } from '../../services/supabaseClient';

const CODE_LENGTH = 6;

type InputRefs = MutableRefObject<HTMLInputElement | null>[];

const SignIn = () => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [notWhitelisted, setNotWhitelisted] = useState(false);
  const [codeDigits, setCodeDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));

  const codeRefs = useMemo<InputRefs>(
    () => Array.from({ length: CODE_LENGTH }, () => useRef<HTMLInputElement | null>(null)),
    [],
  );

  const handleRequestCode = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    setNotWhitelisted(false);

    try {
      const { data, error: whitelistError } = await supabase
        .from('allowed_users')
        .select('email')
        .eq('email', email.toLowerCase())
        .eq('active', true)
        .single();

      if (whitelistError || !data) {
        setLoading(false);
        setNotWhitelisted(true);
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true, emailRedirectTo: window.location.origin },
      });

      setLoading(false);
      if (signInError) {
        setError(signInError.message);
      } else {
        setSent(true);
        setTimeout(() => codeRefs[0]?.current?.focus(), 50);
      }
    } catch (err) {
      console.error('Whitelist check error', err);
      setLoading(false);
      setError('Erreur de vérification. Veuillez réessayer.');
    }
  };

  const handleVerifyCode = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: codeDigits.join(''),
      type: 'email',
    });
    setLoading(false);
    if (verifyError) {
      setError(verifyError.message);
    }
  };

  const resetEmail = () => {
    setSent(false);
    setCodeDigits(Array(CODE_LENGTH).fill(''));
  };

  if (notWhitelisted) {
    return (
      <main className="min-h-screen grid place-items-center p-6" aria-labelledby="access-denied-heading">
        <div className="bg-white border rounded-2xl shadow-sm p-6 w-full max-w-md space-y-5 text-center">
          <div className="flex justify-center mb-4">
            <img src={logoUrl} alt="Chronnix" className="h-12 w-auto" loading="lazy" />
          </div>
          <div className="space-y-3">
            <h1 id="access-denied-heading" className="text-xl font-semibold text-gray-900">
              Accès non autorisé
            </h1>
            <p className="text-gray-600">
              Votre adresse e-mail ne fait pas partie des utilisateurs autorisés pour cette application.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
              <p className="text-sm text-blue-800">Pour demander un accès, veuillez envoyer un e-mail à :</p>
              <a
                href="mailto:andrei@tmfcompta.be?subject=Demande d'accès Chronix Timesheet"
                className="text-blue-600 font-medium hover:underline"
              >
                andrei@tmfcompta.be
              </a>
            </div>
          </div>
          <button onClick={resetEmail} className="btn w-full">
            Essayer avec un autre e-mail
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen grid place-items-center p-6" aria-labelledby="sign-in-heading">
      <div className="bg-white border rounded-2xl shadow-sm p-6 w-full max-w-md space-y-5">
        <div className="flex items-center gap-3">
          <img src={logoUrl} alt="Chronnix" className="h-12 w-auto" loading="lazy" />
          <h1 id="sign-in-heading" className="text-xl font-semibold">
            {sent ? 'Entrez le code' : 'Connexion'}
          </h1>
        </div>
        {!sent ? (
          <form onSubmit={handleRequestCode} className="space-y-3">
            <div>
              <label htmlFor="email" className="text-xs text-gray-500">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-xl border"
                placeholder="vous@exemple.com"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              aria-busy={loading}
              className="w-full btn btn-primary"
            >
              {loading ? 'Vérification…' : 'Recevoir le code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode} className="space-y-3">
            <div>
              <label className="text-xs text-gray-500">Code à 6 chiffres</label>
            </div>
            <div className="flex gap-2 justify-between">
              {codeRefs.map((ref, index) => (
                <input
                  key={index}
                  ref={ref}
                  className="otp-input"
                  inputMode="numeric"
                  maxLength={1}
                  aria-label={`Chiffre ${index + 1}`}
                  value={codeDigits[index]}
                  onChange={(event) => {
                    const digit = event.target.value.replace(/\D/g, '').slice(0, 1);
                    const next = [...codeDigits];
                    next[index] = digit;
                    setCodeDigits(next);
                    if (digit && index < CODE_LENGTH - 1) {
                      codeRefs[index + 1]?.current?.focus();
                    }
                  }}
                  onPaste={
                    index === 0
                      ? (event) => {
                          event.preventDefault();
                          const pasted = event.clipboardData.getData('text');
                          const digits = pasted.replace(/\D/g, '').slice(0, CODE_LENGTH);
                          if (digits.length > 0) {
                            const next = Array(CODE_LENGTH).fill('');
                            for (let i = 0; i < Math.min(digits.length, CODE_LENGTH); i += 1) {
                              next[i] = digits[i];
                            }
                            setCodeDigits(next);
                            const nextIndex = Math.min(digits.length, CODE_LENGTH - 1);
                            setTimeout(() => codeRefs[nextIndex]?.current?.focus(), 10);
                          }
                        }
                      : undefined
                  }
                  onKeyDown={(event) => {
                    if (event.key === 'Backspace' && !codeDigits[index] && index > 0) {
                      codeRefs[index - 1]?.current?.focus();
                    }
                  }}
                />
              ))}
            </div>
            <button
              type="submit"
              disabled={loading || codeDigits.join('').length < CODE_LENGTH}
              aria-busy={loading}
              className="w-full btn btn-primary"
            >
              {loading ? 'Vérification…' : 'Se connecter'}
            </button>
            <button type="button" onClick={resetEmail} className="text-xs text-gray-500 underline">
              Changer d'e-mail
            </button>
          </form>
        )}
        {error && (
          <div className="text-sm text-red-600" role="alert" aria-live="assertive">
            {error}
          </div>
        )}
      </div>
    </main>
  );
};

export default SignIn;
