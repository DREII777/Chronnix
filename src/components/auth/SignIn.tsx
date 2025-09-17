import { FormEvent, useEffect, useRef, useState } from 'react';
import { supabase } from '../../services/supabaseClient';

const CODE_LENGTH = 6;

const SignIn = () => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [notWhitelisted, setNotWhitelisted] = useState(false);
  const [codeDigits, setCodeDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const emailInputRef = useRef<HTMLInputElement | null>(null);
  const codeRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!sent) {
      emailInputRef.current?.focus();
    }
  }, [sent]);

  useEffect(() => {
    if (!sent) {
      return;
    }
    if (typeof window === 'undefined') {
      codeRefs.current[0]?.focus();
      return;
    }
    const timer = window.setTimeout(() => {
      codeRefs.current[0]?.focus();
    }, 60);
    return () => window.clearTimeout(timer);
  }, [sent]);

  const handleRequestCode = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    setNotWhitelisted(false);

    const normalizedEmail = email.trim().toLowerCase();
    setEmail(normalizedEmail);

    try {
      const { data, error: whitelistError } = await supabase
        .from('allowed_users')
        .select('email')
        .eq('email', normalizedEmail)
        .eq('active', true)
        .single();

      if (whitelistError || !data) {
        setLoading(false);
        setNotWhitelisted(true);
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: { shouldCreateUser: true, emailRedirectTo: window.location.origin },
      });

      setLoading(false);
      if (signInError) {
        setError(signInError.message);
      } else {
        setSent(true);
        setCodeDigits(Array(CODE_LENGTH).fill(''));
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
    const token = codeDigits.join('');

    if (token.length < CODE_LENGTH) {
      setLoading(false);
      setError('Veuillez saisir le code complet.');
      return;
    }

    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token,
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
    setError('');
    setNotWhitelisted(false);
    if (typeof window === 'undefined') {
      emailInputRef.current?.focus();
      return;
    }
    window.setTimeout(() => {
      emailInputRef.current?.focus();
    }, 0);
  };

  const updateDigit = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(0, 1);
    setCodeDigits((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });
    if (digit && index < CODE_LENGTH - 1) {
      codeRefs.current[index + 1]?.focus();
    }
  };

  if (notWhitelisted) {
    return (
      <main className="min-h-screen grid place-items-center p-6" aria-labelledby="access-denied-heading">
        <div className="bg-white border rounded-2xl shadow-sm p-6 w-full max-w-md space-y-5 text-center">
          <div className="flex justify-center mb-4">
            <img src="./logo.png" alt="Chronix logo" className="h-12 w-auto rounded-xl" />
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
          <button onClick={resetEmail} className="btn w-full" type="button">
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
          <img src="./logo.png" alt="Chronix logo" className="h-12 w-auto rounded-xl" />
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
                ref={emailInputRef}
                id="email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-xl border"
                placeholder="vous@exemple.com"
                autoComplete="email"
                aria-invalid={Boolean(error && !sent)}
              />
            </div>
            <button type="submit" disabled={loading || !email.trim()} className="w-full btn btn-primary">
              {loading ? 'Vérification...' : 'Recevoir le code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode} className="space-y-3">
            <div>
              <label className="text-xs text-gray-500" htmlFor="otp-0">
                Code à 6 chiffres
              </label>
            </div>
            <div className="flex gap-2 justify-between">
              {codeDigits.map((digit, index) => (
                <input
                  key={index}
                  ref={(element) => {
                    codeRefs.current[index] = element;
                  }}
                  className="otp-input"
                  inputMode="numeric"
                  maxLength={1}
                  id={`otp-${index}`}
                  value={digit}
                  onChange={(event) => updateDigit(index, event.target.value)}
                  onPaste={
                    index === 0
                      ? (event) => {
                          event.preventDefault();
                          const pasted = event.clipboardData.getData('text');
                          const digits = pasted.replace(/\D/g, '').slice(0, CODE_LENGTH);
                          if (digits.length > 0) {
                            setCodeDigits((prev) => {
                              const next = [...prev];
                              for (let i = 0; i < CODE_LENGTH; i += 1) {
                                next[i] = digits[i] ?? '';
                              }
                              return next;
                            });
                            const nextIndex = Math.min(digits.length, CODE_LENGTH - 1);
                            if (typeof window === 'undefined') {
                              codeRefs.current[nextIndex]?.focus();
                            } else {
                              window.setTimeout(() => {
                                codeRefs.current[nextIndex]?.focus();
                              }, 0);
                            }
                          }
                        }
                      : undefined
                  }
                  onKeyDown={(event) => {
                    if (event.key === 'Backspace' && !codeDigits[index] && index > 0) {
                      codeRefs.current[index - 1]?.focus();
                    }
                    if (event.key === 'ArrowLeft' && index > 0) {
                      event.preventDefault();
                      codeRefs.current[index - 1]?.focus();
                    }
                    if (event.key === 'ArrowRight' && index < CODE_LENGTH - 1) {
                      event.preventDefault();
                      codeRefs.current[index + 1]?.focus();
                    }
                  }}
                  autoComplete={index === 0 ? 'one-time-code' : 'off'}
                  aria-label={`Code chiffre ${index + 1}`}
                />
              ))}
            </div>
            <button
              type="submit"
              disabled={loading || codeDigits.join('').length < CODE_LENGTH}
              className="w-full btn btn-primary"
            >
              {loading ? 'Vérification...' : 'Se connecter'}
            </button>
            <button type="button" onClick={resetEmail} className="text-xs text-gray-500 underline">
              Changer d'e-mail
            </button>
          </form>
        )}
        <div className="text-sm" role="status" aria-live="polite">
          {error ? <span className="text-red-600">{error}</span> : null}
        </div>
      </div>
    </main>
  );
};

export default SignIn;
