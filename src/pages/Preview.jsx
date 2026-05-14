import { Link, useParams } from 'react-router-dom';

export default function Preview() {
  const { filename } = useParams();

  return (
    <div>
      <h1>Preview: {filename}</h1>
      <p>Thumbnail and tuning controls will go here in a future pair program.</p>
      <Link to="/videos">Back to videos</Link>
    </div>
  );
}
