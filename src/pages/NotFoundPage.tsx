import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="masthead mb-2">AntiJournals</div>
        <h1 className="text-5xl font-serif text-black mb-6">404</h1>
        <p className="text-secondary-grey text-sm mb-10">
          Publication not found.
        </p>
        <Link to="/" className="btn inline-block">
          Return home
        </Link>
      </div>
    </div>
  );
}

export default NotFoundPage;
