export async function createUser(data: {
  full_name: string;
  email: string;
  phone_number?: string;
  role: string;
  school_id: string;
  username?: string;
}) {
  const res = await fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to create user');
  return json.profile;
}

export async function deleteUser(userId: string) {
  const res = await fetch('/api/users', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to delete user');
  return json;
}
