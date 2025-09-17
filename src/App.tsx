import SignIn from './components/auth/SignIn';
import Dashboard from './components/dashboard/Dashboard';
import { useAuth } from './hooks/useAuth';

const App = () => {
  const { user, loading, error, refresh } = useAuth();

  if (loading) {
    return (
      <main className="min-h-screen grid place-items-center p-6" aria-busy="true">
        <div className="text-center space-y-3" role="status" aria-live="polite">
          <img src="./logo.png" alt="Chronix logo" className="h-12 w-auto mx-auto rounded-xl" />
          <p className="text-gray-600">Chargement de votre espace...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen grid place-items-center p-6" aria-labelledby="auth-error-heading">
        <div className="bg-white border rounded-2xl shadow-sm p-6 w-full max-w-md space-y-4 text-center">
          <h1 id="auth-error-heading" className="text-xl font-semibold text-gray-900">
            Erreur d'authentification
          </h1>
          <p className="text-gray-600" role="alert">
            {error}
          </p>
          <button type="button" onClick={refresh} className="btn btn-primary">
            Réessayer
          </button>
        </div>
      </main>
    );
  }

  return user ? <Dashboard user={user} /> : <SignIn />;
};

export default App;
