import { Link } from 'react-router-dom'

/**
 * The app root deliberately shows no restaurant directory.
 *
 * Every tenant is reached by its own link — staff bookmark /r/<slug>/admin,
 * guests arrive by scanning a table QR — so there is no shared marketplace page
 * where one restaurant is listed alongside another.
 */
export default function NoRestaurant() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900 px-6">
      <div className="w-full max-w-md text-center">
        <h1 className="text-3xl font-semibold text-white">Restaurant not specified</h1>
        <p className="mt-3 text-gray-400">
          This app serves each restaurant at its own address. Open the link your restaurant gave
          you, or scan the QR code on your table.
        </p>

        <div className="mt-6 rounded-lg border border-gray-700 bg-gray-800/60 p-4 text-left">
          <p className="text-xs uppercase tracking-wide text-gray-500">Address format</p>
          <code className="mt-1 block break-all text-sm text-gray-300">
            {window.location.origin}/r/&lt;your-restaurant&gt;
          </code>
        </div>

        <Link
          to="/platform/login"
          className="mt-6 inline-block text-sm text-gray-500 underline underline-offset-4 hover:text-gray-300"
        >
          Platform administrator sign-in
        </Link>
      </div>
    </div>
  )
}
