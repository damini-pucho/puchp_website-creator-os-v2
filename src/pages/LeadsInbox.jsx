import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Button, EmptyState } from '../components/ui/Cards';
import { Tabs, Tag, IconButton, Drawer, KeyValue, SectionLabel } from '../components/ui/primitives';
import Input from '../components/ui/Input';
import { useData } from '../context/DataContext';
import { MessageSquare, Layout, Calendar, Trash, Plus, Phone, Mail, ArrowLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

const linkBtn = 'inline-flex items-center justify-center gap-2 h-11 sm:h-10 px-4 rounded-xl text-sm font-medium bg-surface text-ink border border-line-strong hover:bg-surface-2 transition-colors duration-150';

export default function LeadsInbox() {
  const { clientId } = useParams();
  const { leads, forms } = useData();
  const [activeSubTab, setActiveSubTab] = useState('leads');
  const [localForms, setLocalForms] = useState(forms);
  const [openLead, setOpenLead] = useState(null);

  // Form Builder state
  const [selectedForm, setSelectedForm] = useState(null);
  const [newFieldName, setNewFieldName] = useState('');

  // Sync local forms when the database data changes
  React.useEffect(() => { setLocalForms(forms); }, [forms]);

  const handleAddField = () => {
    if (!newFieldName.trim() || !selectedForm) return;
    setLocalForms(prev => prev.map(f => {
      if (f.id === selectedForm.id) {
        return { ...f, fields: [...f.fields, newFieldName] };
      }
      return f;
    }));
    setSelectedForm(prev => ({ ...prev, fields: [...prev.fields, newFieldName] }));
    setNewFieldName('');
    toast.success('Field added to form!');
  };

  const handleDeleteField = (fieldName) => {
    if (!selectedForm) return;
    setLocalForms(prev => prev.map(f => {
      if (f.id === selectedForm.id) {
        return { ...f, fields: f.fields.filter(fld => fld !== fieldName) };
      }
      return f;
    }));
    setSelectedForm(prev => ({ ...prev, fields: prev.fields.filter(fld => fld !== fieldName) }));
    toast.error('Field removed.');
  };

  return (
    <div className="space-y-6">

      <Tabs
        tabs={[
          { id: 'leads', label: 'Leads', icon: MessageSquare, count: leads.length },
          { id: 'forms', label: 'Forms', icon: Layout, count: localForms.length },
          { id: 'bookings', label: 'Bookings', icon: Calendar }
        ]}
        value={activeSubTab}
        onChange={(id) => {
          setActiveSubTab(id);
          setSelectedForm(null);
        }}
      />

      {/* Leads inbox */}
      {activeSubTab === 'leads' && (
        leads.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="No leads yet"
            description="Enquiries from the live site's forms land here, with the page and keyword that brought them in."
          />
        ) : (
          <Card padded={false} className="overflow-hidden animate-fade-in">
            {/* table — 640 px and up; a row opens the lead */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead className="bg-surface-2 border-b border-line">
                  <tr>
                    <th className="label-mono px-4 py-3 font-normal">Date</th>
                    <th className="label-mono px-4 py-3 font-normal">Contact</th>
                    <th className="label-mono px-4 py-3 font-normal">Message</th>
                    <th className="label-mono px-4 py-3 font-normal">Source page</th>
                    <th className="label-mono px-4 py-3 font-normal">Keyword</th>
                    <th className="w-10" aria-hidden />
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-soft">
                  {leads.map((lead) => (
                    <tr
                      key={lead.id}
                      tabIndex={0}
                      onClick={() => setOpenLead(lead)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpenLead(lead); } }}
                      className="cursor-pointer hover:bg-hover transition-colors duration-150 focus-visible:bg-hover"
                    >
                      <td className="px-4 py-3 text-ink-3 tabular-nums whitespace-nowrap align-top">{lead.date}</td>
                      <td className="px-4 py-3 align-top">
                        <p className="font-medium text-ink">{lead.name}</p>
                        <p className="text-xs text-ink-3 mt-0.5 truncate max-w-[220px]">{lead.email}</p>
                        <p className="text-xs text-ink-3 tabular-nums">{lead.phone}</p>
                      </td>
                      <td className="px-4 py-3 text-ink-2 align-top max-w-xs"><p className="line-clamp-2">{lead.message}</p></td>
                      <td className="px-4 py-3 align-top">{lead.page && <Tag>{lead.page}</Tag>}</td>
                      <td className="px-4 py-3 align-top">{lead.keyword && <Tag>{lead.keyword}</Tag>}</td>
                      <td className="px-2 py-3 align-top text-ink-4"><ChevronRight className="w-4 h-4" strokeWidth={1.7} aria-hidden /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* stacked cards — under 640 px */}
            <ul className="sm:hidden divide-y divide-line-soft">
              {leads.map((lead) => (
                <li key={lead.id}>
                  <button type="button" onClick={() => setOpenLead(lead)} className="w-full text-left p-4 space-y-1.5 hover:bg-hover transition-colors duration-150">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-medium text-ink min-w-0 truncate">{lead.name}</p>
                      <span className="text-xs text-ink-3 tabular-nums shrink-0">{lead.date}</span>
                    </div>
                    {lead.message && <p className="text-[13px] text-ink-2 line-clamp-2">{lead.message}</p>}
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {lead.page && <Tag>{lead.page}</Tag>}
                      {lead.keyword && <Tag>{lead.keyword}</Tag>}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        )
      )}

      {/* Forms builder — list */}
      {activeSubTab === 'forms' && !selectedForm && (
        localForms.length === 0 ? (
          <EmptyState
            icon={Layout}
            title="No forms yet"
            description="Forms come from the site build. Once a page has a form, configure its fields here."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
            {localForms.map((f) => (
              <Card key={f.id} className="flex flex-col gap-4 justify-between">
                <div className="space-y-3">
                  <div className="flex justify-between items-start gap-3">
                    <h4 className="text-[15px] leading-6 font-semibold text-ink min-w-0 break-words">{f.name}</h4>
                    <span className="text-xs text-ink-3 tabular-nums shrink-0 pt-1">{f.submissions} submissions</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {f.fields.map((field, idx) => (
                      <Tag key={idx}>{field}</Tag>
                    ))}
                  </div>
                </div>

                <div className="border-t border-line-soft pt-3 flex justify-end">
                  <Button variant="secondary" size="sm" onClick={() => setSelectedForm(f)}>
                    Configure fields
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )
      )}

      {/* Forms builder — field editor */}
      {activeSubTab === 'forms' && selectedForm && (
        <div className="max-w-xl mx-auto space-y-4 animate-fade-in">
          <Button variant="ghost" size="sm" icon={ArrowLeft} onClick={() => setSelectedForm(null)} className="-ml-2">
            Back to forms
          </Button>

          <Card className="space-y-5">
            <div>
              <p className="label-mono">Edit fields</p>
              <h4 className="text-[15px] leading-6 font-semibold text-ink break-words">{selectedForm.name}</h4>
            </div>

            <div className="space-y-2">
              <SectionLabel count={selectedForm.fields.length}>Form fields</SectionLabel>
              <ul className="space-y-1.5">
                {selectedForm.fields.map((field, idx) => (
                  <li key={idx} className="flex items-center justify-between gap-3 pl-3 pr-1 py-1 bg-surface-2 rounded-xl">
                    <span className="text-[13px] text-ink min-w-0 break-words">{field}</span>
                    <IconButton
                      icon={Trash}
                      label={`Remove ${field}`}
                      onClick={() => handleDeleteField(field)}
                      className="hover:text-bad-text hover:bg-bad-soft"
                    />
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-end gap-3 pt-1">
              <div className="flex-1 min-w-0">
                <Input
                  label="New field name"
                  placeholder="e.g. Preferred contact hour"
                  value={newFieldName}
                  onChange={e => setNewFieldName(e.target.value)}
                />
              </div>
              <Button icon={Plus} size="lg" onClick={handleAddField}>
                Add field
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Bookings */}
      {activeSubTab === 'bookings' && (
        <EmptyState
          icon={Calendar}
          title="No consultations booked yet"
          description="Bookings appear here once customers schedule a consultation from the site."
        />
      )}

      {/* Lead detail */}
      <Drawer
        open={!!openLead}
        onClose={() => setOpenLead(null)}
        title={openLead?.name || 'Lead'}
        description={openLead?.date ? `Received ${openLead.date}` : undefined}
        footer={openLead && (openLead.email || openLead.phone) ? (
          <>
            {openLead.phone && <a href={`tel:${String(openLead.phone).replace(/\s+/g, '')}`} className={linkBtn}><Phone className="w-4 h-4" strokeWidth={1.7} aria-hidden />Call</a>}
            {openLead.email && <a href={`mailto:${openLead.email}`} className={linkBtn}><Mail className="w-4 h-4" strokeWidth={1.7} aria-hidden />Email</a>}
          </>
        ) : undefined}
      >
        {openLead && (
          <div className="space-y-5">
            <div className="space-y-2">
              <SectionLabel>Message</SectionLabel>
              <p className="text-sm text-ink-2 leading-relaxed bg-surface-2 rounded-xl p-3 whitespace-pre-wrap break-words">{openLead.message || '—'}</p>
            </div>
            <div>
              <SectionLabel>Details</SectionLabel>
              <div className="mt-1">
                <KeyValue label="Email">{openLead.email || '—'}</KeyValue>
                <KeyValue label="Phone"><span className="tabular-nums">{openLead.phone || '—'}</span></KeyValue>
                <KeyValue label="Source page">{openLead.page || '—'}</KeyValue>
                <KeyValue label="Source keyword">{openLead.keyword || '—'}</KeyValue>
              </div>
            </div>
          </div>
        )}
      </Drawer>

    </div>
  );
}
