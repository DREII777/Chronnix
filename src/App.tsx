import SignIn from './components/auth/SignIn';
import Dashboard from './components/dashboard/Dashboard';
import { useAuth } from './hooks/useAuth';

const App = () => {
  const { user } = useAuth();
  return user ? <Dashboard user={user} /> : <SignIn />;
};

export default App;
