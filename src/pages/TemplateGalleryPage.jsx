import React from 'react';
import TemplateGallery from '../components/TemplateGallery';
import { useClients } from '../context/ClientContext';
import { Page, PageHeader, Select } from '../components/ui/primitives';

export default function TemplateGalleryPage() {
  const { clients, selectedClient, setSelectedClient } = useClients();

  return (
    <Page>
      {/* Context line + the client a template is applied to */}
      <PageHeader
        description="Website templates for Indian MSMEs, B2B exporters, luxury brands and local service providers. Every template supports Pucho Code generation, Schema.org entities and AEO voice answers."
        actions={
          <label className="flex flex-col gap-1.5 w-full sm:w-72">
            <span className="text-[13px] font-medium text-ink-3">Assign to client</span>
            <Select
              value={selectedClient?.id || ''}
              onChange={(e) => {
                const hit = clients.find((c) => c.id === e.target.value);
                if (hit) setSelectedClient(hit);
              }}
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.industry || 'Business'})
                </option>
              ))}
            </Select>
          </label>
        }
      />

      {/* Embedded Modern Template Gallery Component */}
      <div className="min-h-[700px]">
        <TemplateGallery isStandalonePage={true} />
      </div>
    </Page>
  );
}
