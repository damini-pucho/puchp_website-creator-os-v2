// Not found — an unknown address inside the app (QA L-04) or a client id that does not resolve (QA M-02).
// A missing client never falls back to an empty, editable Setup form, so nothing can be saved under a made-up id.
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchX, UserX } from 'lucide-react';
import { EmptyState, Button } from '../components/ui/Cards';

export default function NotFound({ kind = 'page' }) {
  const navigate = useNavigate();
  const client = kind === 'client';
  return (
    <div className="max-w-xl mx-auto pt-6 sm:pt-12 animate-fade-in">
      <EmptyState
        icon={client ? UserX : SearchX}
        title={client ? 'Client not found' : 'Page not found'}
        description={client
          ? 'There is no client with this link. It may have been deleted, or the address was typed wrongly.'
          : 'This address does not exist in Website Creator OS.'}
        action={
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button variant="secondary" onClick={() => navigate('/overview')}>Go to overview</Button>
            <Button onClick={() => navigate('/clients')}>{client ? 'All clients' : 'Open clients'}</Button>
          </div>
        }
      />
    </div>
  );
}
