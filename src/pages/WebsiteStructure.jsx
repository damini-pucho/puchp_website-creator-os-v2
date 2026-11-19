import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useClients } from '../context/ClientContext';
import { Card, Button } from '../components/ui/Cards';
import { SectionLabel, Field, Select, TextInput, Modal, cx } from '../components/ui/primitives';
import { Network, Plus, Trash2, ArrowUp, ArrowDown, Edit3, Save, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export default function WebsiteStructure() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const { getClient, updateSitemap } = useClients();

  const client = getClient(clientId);
  const [sitemap, setSitemap] = useState([]);
  
  // Modal for new page
  const [showAddPageModal, setShowAddPageModal] = useState(false);
  const [newPageName, setNewPageName] = useState('');
  const [newPageKeyword, setNewPageKeyword] = useState('');
  const [newPageType, setNewPageType] = useState('Service');

  // Load sitemap from client
  useEffect(() => {
    if (!client) return;

    if (!client.sitemap || client.sitemap.length === 0) {
      // Auto-generate sitemap based on approved keywords (1 keyword per page)
      const approved = client.keywordsApproved?.filter(k => k.approved) || [];
      const generated = approved.map((kw, i) => {
        let type = 'Service';
        if (i === 0) type = 'Home';
        else if (kw.intent === 'local') type = 'Location';
        else if (kw.intent === 'informational') type = 'Blog';
        
        // Custom name based on keyword
        const title = kw.keyword.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        
        return {
          id: `page-${Date.now()}-${i}`,
          name: title,
          keyword: kw.keyword,
          type: type,
          order: i
        };
      });

      // Default fallback if no keywords approved (should be guarded, but safe check)
      if (generated.length === 0) {
        generated.push({ id: 'page-fallback-home', name: 'Home', keyword: 'organic marketing', type: 'Home', order: 0 });
      }

      setSitemap(generated);
      updateSitemap(clientId, generated);
    } else {
      setSitemap([...client.sitemap].sort((a, b) => a.order - b.order));
    }
  }, [clientId, client]);

  const handleSave = () => {
    // Re-index orders to ensure consistency
    const sorted = sitemap.map((page, idx) => ({ ...page, order: idx }));
    setSitemap(sorted);
    updateSitemap(clientId, sorted);
    toast.success('Website sitemap saved successfully!');
  };

  const handleSaveAndContinue = () => {
    handleSave();
    setTimeout(() => {
      navigate(`/clients/${clientId}/planning`);
    }, 200);
  };

  // Node reordering simulations (Arrow click translates to indices moving)
  const moveNode = (index, direction) => {
    const list = [...sitemap];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;

    // Swap elements
    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;

    // Re-order parameter
    const updated = list.map((item, idx) => ({ ...item, order: idx }));
    setSitemap(updated);
    updateSitemap(clientId, updated);
  };

  const removeNode = (index) => {
    if (sitemap.length === 1) {
      toast.error('Your sitemap must contain at least 1 page (Home).');
      return;
    }
    const pageName = sitemap[index].name;
    const list = sitemap.filter((_, i) => i !== index).map((item, idx) => ({ ...item, order: idx }));
    setSitemap(list);
    updateSitemap(clientId, list);
    toast.error(`Removed page: "${pageName}" from sitemap structure.`);
  };

  const handleEditNodeName = (index, newName) => {
    const list = [...sitemap];
    list[index].name = newName;
    setSitemap(list);
  };

  const handleEditNodeType = (index, newType) => {
    const list = [...sitemap];
    list[index].type = newType;
    setSitemap(list);
  };

  const addManualPage = (e) => {
    e.preventDefault();
    if (!newPageName.trim()) return;

    const newPage = {
      id: `page-m-${Date.now()}`,
      name: newPageName,
      keyword: newPageKeyword || 'None',
      type: newPageType,
      order: sitemap.length
    };

    const list = [...sitemap, newPage];
    setSitemap(list);
    updateSitemap(clientId, list);
    setShowAddPageModal(false);
    setNewPageName('');
    setNewPageKeyword('');
    toast.success(`Added page "${newPageName}" to sitemap tree.`);
  };

  // Stable close handler so the modal's focus / Escape effect does not re-run on every keystroke.
  const closeAddPageModal = useCallback(() => setShowAddPageModal(false), []);

  return (
    <div className="space-y-5 sm:space-y-6 max-w-4xl mx-auto">
      {/* Header and controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <SectionLabel count={sitemap.length}>Sitemap pages</SectionLabel>
          <p className="text-sm text-ink-3">Reorder, rename and set the type of each page. One target keyword per page.</p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          icon={Plus}
          type="button"
          onClick={() => setShowAddPageModal(true)}
          className="h-11 sm:h-[33px] w-full sm:w-auto"
        >
          Add custom page
        </Button>
      </div>

      {/* Sitemap tree — hairline connectors */}
      <Card>
        <div className="flex items-center gap-2 pb-1">
          <span className="w-[22px] h-[22px] rounded-md bg-surface-2 text-ink-2 flex items-center justify-center shrink-0" aria-hidden>
            <Network className="w-3.5 h-3.5" strokeWidth={1.7} />
          </span>
          <span className="text-[13px] font-medium text-ink truncate">{client?.name || 'Website'}</span>
          <span className="text-xs text-ink-3">· site root</span>
        </div>

        <ol className="ml-[11px]" aria-label="Sitemap pages">
          {sitemap.map((page, index) => {
            const isLast = index === sitemap.length - 1;
            return (
              <li key={page.id} className="relative pl-6 py-1.5 animate-fade-in">
                {/* connectors */}
                <span aria-hidden className={cx('absolute left-0 top-0 border-l border-line', isLast ? 'h-1/2' : 'bottom-0')} />
                <span aria-hidden className="absolute left-0 top-1/2 w-5 border-t border-line" />

                <div className="group flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-xl bg-surface-2 px-3 py-2.5">
                  {/* Node details */}
                  <div className="flex-1 min-w-0 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-5">
                    {/* Editable title */}
                    <div className="flex items-center gap-1.5 min-w-0 w-full sm:w-auto">
                      <span className="text-xs text-ink-3 tabular-nums w-5 shrink-0">{index + 1}.</span>
                      <input
                        type="text"
                        aria-label="Page name"
                        value={page.name}
                        onChange={e => handleEditNodeName(index, e.target.value)}
                        className="flex-1 sm:flex-none min-w-0 sm:min-w-[140px] text-sm font-medium text-ink bg-transparent rounded-md border border-transparent hover:border-line focus:border-accent outline-none px-1.5 py-1 transition-colors duration-150"
                      />
                      <Edit3 className="w-3.5 h-3.5 text-ink-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150" strokeWidth={1.7} aria-hidden />
                    </div>

                    {/* Keyword */}
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs text-ink-3 leading-4">Target keyword</span>
                      <span className="text-[13px] text-ink-2 truncate max-w-[240px] sm:max-w-[200px] mt-0.5">{page.keyword}</span>
                    </div>

                    {/* Page type */}
                    <div className="flex flex-col">
                      <label htmlFor={`page-type-${page.id}`} className="text-xs text-ink-3 leading-4">Page type</label>
                      <Select
                        id={`page-type-${page.id}`}
                        value={page.type}
                        onChange={e => handleEditNodeType(index, e.target.value)}
                        className="!w-auto !min-h-9 !py-1 mt-0.5 text-[13px]"
                      >
                        <option value="Home">Home</option>
                        <option value="Service">Service</option>
                        <option value="Location">Location</option>
                        <option value="Blog">Blog</option>
                        <option value="Landing">Landing</option>
                      </Select>
                    </div>
                  </div>

                  {/* Node actions (reorder & remove) */}
                  <div className="flex items-center justify-end gap-1 border-t sm:border-t-0 border-line-soft pt-2 sm:pt-0">
                    <NodeAction icon={ArrowUp} label="Move up" onClick={() => moveNode(index, 'up')} disabled={index === 0} />
                    <NodeAction icon={ArrowDown} label="Move down" onClick={() => moveNode(index, 'down')} disabled={index === sitemap.length - 1} />
                    <NodeAction icon={Trash2} label="Remove page" onClick={() => removeNode(index)} danger />
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </Card>

      {/* Add custom page */}
      <Modal
        open={showAddPageModal}
        onClose={closeAddPageModal}
        title="Add custom sitemap page"
        size="sm"
        footer={
          <>
            <Button variant="secondary" type="button" onClick={() => setShowAddPageModal(false)}>Cancel</Button>
            <Button type="submit" form="add-page-form">Save & insert</Button>
          </>
        }
      >
        <form id="add-page-form" onSubmit={addManualPage} className="space-y-4">
          <Field label="Page name" htmlFor="new-page-name" required>
            <TextInput
              id="new-page-name"
              type="text"
              required
              placeholder="e.g. Wholesale Price Brochure"
              value={newPageName}
              onChange={e => setNewPageName(e.target.value)}
            />
          </Field>

          <Field label="Page keyword / target" htmlFor="new-page-keyword">
            <TextInput
              id="new-page-keyword"
              type="text"
              placeholder="e.g. bulk spices wholesale catalog"
              value={newPageKeyword}
              onChange={e => setNewPageKeyword(e.target.value)}
            />
          </Field>

          <Field label="Page type" htmlFor="new-page-type">
            <Select
              id="new-page-type"
              value={newPageType}
              onChange={e => setNewPageType(e.target.value)}
            >
              <option value="Home">Home</option>
              <option value="Service">Service</option>
              <option value="Location">Location</option>
              <option value="Blog">Blog</option>
              <option value="Landing">Landing</option>
            </Select>
          </Field>
        </form>
      </Modal>

      {/* Action footer */}
      <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2">
        <Button variant="secondary" icon={Save} type="button" onClick={handleSave}>
          Save structure
        </Button>
        <Button
          iconRight={ArrowRight}
          type="button"
          onClick={handleSaveAndContinue}
        >
          Continue to page planning
        </Button>
      </div>
    </div>
  );
}

/** NodeAction — icon-only tree action: 44 px on phones, 32 px on desktop, aria-label + tooltip. */
function NodeAction({ icon: Icon, label, onClick, disabled, danger = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cx(
        'inline-flex items-center justify-center w-11 h-11 sm:w-8 sm:h-8 rounded-md text-ink-3 transition-colors duration-150 disabled:text-ink-4 disabled:hover:bg-transparent',
        danger ? 'hover:bg-bad-soft hover:text-bad-text' : 'hover:bg-surface hover:text-ink'
      )}
    >
      <Icon className="w-4 h-4" strokeWidth={1.7} aria-hidden />
    </button>
  );
}
