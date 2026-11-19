import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useClients } from '../context/ClientContext';
import { Card, Button, StatusPill, EmptyState } from '../components/ui/Cards';
import { Badge, Tag, Field, Select, TextInput, Working, Modal, cx } from '../components/ui/primitives';
import Input from '../components/ui/Input';
import { Search, Check, X, Edit, Trash, Plus, ThumbsUp, ArrowRight, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function KeywordResearch() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const { getClient, updateKeywords, approveAllKeywords } = useClients();

  const client = getClient(clientId);
  const [loading, setLoading] = useState(false);
  const [progressLog, setProgressLog] = useState([]);
  const [keywords, setKeywords] = useState([]);
  const [editingIndex, setEditingIndex] = useState(-1);
  const [editKeyword, setEditKeyword] = useState('');
  const [editVolume, setEditVolume] = useState('');
  const [editDifficulty, setEditDifficulty] = useState('Medium');
  
  // Modal for new keyword
  const [showAddModal, setShowAddModal] = useState(false);
  const [newKeywordText, setNewKeywordText] = useState('');
  const [newIntent, setNewIntent] = useState('commercial');
  const [newVolume, setNewVolume] = useState('1000');
  const [newDiff, setNewDiff] = useState('Low');

  // Load keywords from DB; do NOT generate mock keywords.
  useEffect(() => {
    if (!client) return;
    setKeywords(client.keywordsApproved || []);
  }, [clientId, client]);

  // Sync back to context when local state updates
  const syncToContext = (updatedList) => {
    setKeywords(updatedList);
    updateKeywords(clientId, updatedList);
  };

  const runKeywordAgent = () => {
    setLoading(true);
    setProgressLog([]);

    const logs = [
      'Initializing Website Analyzer Agent...',
      client?.existingUrl
        ? `Crawling & analyzing site structure: ${client.existingUrl}...`
        : 'No existing site. Scoping industry profile...',
      'Mapping core products and services...',
      'Running Google Search Console query simulator...',
      'Evaluating keyword difficulty and competitive gaps...',
      'Generating optimized list of recommended pages...'
    ];

    logs.forEach((log, index) => {
      setTimeout(() => {
        setProgressLog(prev => [...prev, log]);
        if (index === logs.length - 1) {
          // Keep existing keywords from DB — no mock generation.
          setLoading(false);
          toast.info('Keyword list loaded from database.');
        }
      }, (index + 1) * 800);
    });
  };

  const handleApprove = (index) => {
    const list = [...keywords];
    list[index].approved = !list[index].approved;
    syncToContext(list);
    toast.success(list[index].approved ? 'Keyword approved' : 'Keyword approval removed');
  };

  const handleApproveAll = () => {
    approveAllKeywords(clientId);
    const list = keywords.map(k => ({ ...k, approved: true }));
    setKeywords(list);
    toast.success('Approved all keywords for site planning!');
  };

  const handleRemove = (index) => {
    const keywordText = keywords[index].keyword;
    const list = keywords.filter((_, i) => i !== index);
    syncToContext(list);
    toast.error(`Removed keyword: "${keywordText}"`);
  };

  // Inline edit keyword
  const startEdit = (index) => {
    setEditingIndex(index);
    setEditKeyword(keywords[index].keyword);
    setEditVolume(keywords[index].volume);
    setEditDifficulty(keywords[index].difficulty);
  };

  const saveEdit = (index) => {
    if (!editKeyword.trim()) return;
    const list = [...keywords];
    list[index] = {
      ...list[index],
      keyword: editKeyword,
      volume: parseInt(editVolume) || 0,
      difficulty: editDifficulty
    };
    syncToContext(list);
    setEditingIndex(-1);
    toast.success('Keyword updated.');
  };

  const addManualKeyword = (e) => {
    e.preventDefault();
    if (!newKeywordText.trim()) return;
    const newK = {
      keyword: newKeywordText,
      intent: newIntent,
      volume: parseInt(newVolume) || 100,
      difficulty: newDiff,
      assignedPage: newKeywordText.charAt(0).toUpperCase() + newKeywordText.slice(1),
      approved: true // Auto approve manual additions
    };
    syncToContext([...keywords, newK]);
    setShowAddModal(false);
    setNewKeywordText('');
    toast.success('Added and approved manual seed keyword.');
  };

  const approvedCount = keywords.filter(k => k.approved).length;

  // Stable close handler so the modal's focus / Escape effect does not re-run on every keystroke.
  const closeAddModal = useCallback(() => setShowAddModal(false), []);

  // Difficulty is a scale, not a failure: low = ok, medium = neutral, high = warn (red stays for failed / destructive).
  const difficultyTone = (d) => (d === 'High' ? 'warn' : d === 'Low' ? 'ok' : 'neutral');

  // Row actions — shared by the desktop table and the phone cards (same handlers).
  const rowActions = (kw, index, isEditing, big = false) => {
    const size = big ? 'w-11 h-11' : 'w-8 h-8';
    const base = cx('inline-flex items-center justify-center rounded-md border transition-colors duration-150 shrink-0', size);
    return (
      <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
        {isEditing ? (
          <>
            <button type="button" onClick={() => saveEdit(index)} aria-label="Save keyword" title="Save keyword"
              className={cx(base, 'border-line text-ok-text hover:bg-ok-soft')}>
              <Check className="w-4 h-4" strokeWidth={1.7} aria-hidden />
            </button>
            <button type="button" onClick={() => setEditingIndex(-1)} aria-label="Cancel edit" title="Cancel edit"
              className={cx(base, 'border-line text-ink-3 hover:bg-surface-2 hover:text-ink')}>
              <X className="w-4 h-4" strokeWidth={1.7} aria-hidden />
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => handleApprove(index)}
              aria-pressed={!!kw.approved}
              aria-label={kw.approved ? 'Remove approval' : 'Approve keyword'}
              title={kw.approved ? 'Approved — click to remove approval' : 'Approve keyword'}
              className={cx(base, kw.approved ? 'bg-ok-soft text-ok-text border-ok-edge' : 'border-line text-ink-3 hover:bg-surface-2 hover:text-ink')}
            >
              <Check className="w-4 h-4" strokeWidth={1.7} aria-hidden />
            </button>
            <button type="button" onClick={() => startEdit(index)} aria-label="Edit keyword" title="Edit keyword"
              className={cx(base, 'border-line text-ink-3 hover:bg-surface-2 hover:text-ink')}>
              <Edit className="w-4 h-4" strokeWidth={1.7} aria-hidden />
            </button>
            <button type="button" onClick={() => handleRemove(index)} aria-label="Remove keyword" title="Remove keyword"
              className={cx(base, 'border-line text-ink-3 hover:bg-bad-soft hover:text-bad-text hover:border-bad-edge')}>
              <Trash className="w-4 h-4" strokeWidth={1.7} aria-hidden />
            </button>
          </>
        )}
      </div>
    );
  };

  const editKeywordInput = (
    <TextInput
      type="text"
      aria-label="Keyword"
      value={editKeyword}
      onChange={e => setEditKeyword(e.target.value)}
      className="!min-h-9 !py-1.5 text-[13px]"
    />
  );
  const editVolumeInput = (
    <TextInput
      type="number"
      aria-label="Monthly search volume"
      value={editVolume}
      onChange={e => setEditVolume(e.target.value)}
      className="!w-24 !min-h-9 !py-1.5 text-[13px] tabular-nums"
    />
  );
  const editDifficultySelect = (
    <Select
      aria-label="Difficulty"
      value={editDifficulty}
      onChange={e => setEditDifficulty(e.target.value)}
      className="!w-28 !min-h-9 !py-1.5 text-[13px]"
    >
      <option value="Low">Low</option>
      <option value="Medium">Medium</option>
      <option value="High">High</option>
    </Select>
  );

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Approval gate + actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3">
        <div className="min-w-0 space-y-1">
          <p className="label-mono">Approved keywords</p>
          <p className="text-sm text-ink-2">
            <span className="font-semibold text-ink tabular-nums">{approvedCount}</span> of <span className="tabular-nums">{keywords.length}</span> approved
            <span className="text-ink-3"> · at least 1 required to continue</span>
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="secondary" size="sm" icon={RefreshCw} type="button" onClick={runKeywordAgent} disabled={loading} className="flex-1 sm:flex-none h-11 sm:h-[33px]">
            Re-run research agent
          </Button>
          <Button variant="secondary" size="sm" icon={Plus} type="button" onClick={() => setShowAddModal(true)} className="flex-1 sm:flex-none h-11 sm:h-[33px]">
            Add keyword
          </Button>
        </div>
      </div>

      {/* Running state */}
      {loading ? (
        <Card className="flex flex-col items-center justify-center gap-2 min-h-[240px] text-center">
          <Working>Keyword research agent running…</Working>
          <p className="text-xs text-ink-3">The list reloads from the database when it finishes.</p>
        </Card>
      ) : keywords.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No keywords yet"
          description="Keywords appear here once the planning workflow writes them to the database. You can also add a seed keyword by hand."
          action={<Button variant="secondary" icon={Plus} onClick={() => setShowAddModal(true)}>Add keyword</Button>}
        />
      ) : (
        <>
          {/* Desktop / tablet table */}
          <Card padded={false} className="hidden sm:block overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead className="bg-surface-2 border-b border-line">
                  <tr>
                    <th scope="col" className="label-mono px-4 py-3 font-normal">Keyword</th>
                    <th scope="col" className="label-mono px-4 py-3 font-normal">Intent</th>
                    <th scope="col" className="label-mono px-4 py-3 font-normal">Volume / mo</th>
                    <th scope="col" className="label-mono px-4 py-3 font-normal">Difficulty</th>
                    <th scope="col" className="label-mono px-4 py-3 font-normal">Status</th>
                    <th scope="col" className="label-mono px-4 py-3 font-normal text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-soft">
                  {keywords.map((kw, index) => {
                    const isEditing = index === editingIndex;
                    return (
                      <tr key={index} className="hover:bg-hover transition-colors duration-150">
                        <td className="px-4 py-2.5 font-medium text-ink min-w-[180px]">
                          {isEditing ? editKeywordInput : <span>{kw.keyword}</span>}
                        </td>
                        <td className="px-4 py-2.5">
                          <Tag className="capitalize">{kw.intent}</Tag>
                        </td>
                        <td className="px-4 py-2.5 text-ink tabular-nums">
                          {isEditing ? editVolumeInput : <span>{kw.volume.toLocaleString('en-IN')}</span>}
                        </td>
                        <td className="px-4 py-2.5">
                          {isEditing ? editDifficultySelect : <Badge tone={difficultyTone(kw.difficulty)}>{kw.difficulty}</Badge>}
                        </td>
                        <td className="px-4 py-2.5">
                          <StatusPill status={kw.approved ? 'Approved' : 'Pending'} label={kw.approved ? 'Approved' : 'Pending'} />
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          {rowActions(kw, index, isEditing)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Phones: stacked cards */}
          <div className="sm:hidden space-y-3">
            {keywords.map((kw, index) => {
              const isEditing = index === editingIndex;
              return (
                <Card key={index} className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      {isEditing ? editKeywordInput : <p className="text-sm font-medium text-ink break-words">{kw.keyword}</p>}
                    </div>
                    <StatusPill status={kw.approved ? 'Approved' : 'Pending'} label={kw.approved ? 'Approved' : 'Pending'} />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[13px]">
                    <div className="min-w-0">
                      <p className="text-xs text-ink-3">Intent</p>
                      <p className="text-ink capitalize truncate mt-0.5">{kw.intent}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-ink-3">Volume / mo</p>
                      <div className="mt-0.5 tabular-nums text-ink">{isEditing ? editVolumeInput : kw.volume.toLocaleString('en-IN')}</div>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-ink-3">Difficulty</p>
                      <div className="mt-0.5">{isEditing ? editDifficultySelect : <Badge tone={difficultyTone(kw.difficulty)}>{kw.difficulty}</Badge>}</div>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-line-soft">
                    {rowActions(kw, index, isEditing, true)}
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {/* Add seed keyword */}
      <Modal
        open={showAddModal}
        onClose={closeAddModal}
        title="Add seed keyword"
        description="Manual keywords are approved straight away."
        size="sm"
        footer={
          <>
            <Button variant="secondary" type="button" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button type="submit" form="add-keyword-form">Save & approve</Button>
          </>
        }
      >
        <form id="add-keyword-form" onSubmit={addManualKeyword} className="space-y-4">
          <Input
            label="Seed keyword"
            placeholder="e.g. bulk saffron dealers"
            value={newKeywordText}
            onChange={e => setNewKeywordText(e.target.value)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Intent" htmlFor="kw-new-intent">
              <Select
                id="kw-new-intent"
                value={newIntent}
                onChange={e => setNewIntent(e.target.value)}
              >
                <option value="commercial">Commercial</option>
                <option value="local">Local</option>
                <option value="informational">Informational</option>
              </Select>
            </Field>
            <Field label="Difficulty" htmlFor="kw-new-diff">
              <Select
                id="kw-new-diff"
                value={newDiff}
                onChange={e => setNewDiff(e.target.value)}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </Select>
            </Field>
          </div>

          <Input
            label="Monthly search volume"
            type="number"
            placeholder="1000"
            value={newVolume}
            onChange={e => setNewVolume(e.target.value)}
          />
        </form>
      </Modal>

      {/* Footer actions */}
      <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2">
        <Button variant="secondary" icon={ThumbsUp} type="button" onClick={handleApproveAll} disabled={keywords.length === 0 || loading}>
          Approve all
        </Button>
        <Button
          iconRight={ArrowRight}
          type="button"
          disabled={approvedCount === 0 || loading}
          onClick={() => navigate(`/clients/${clientId}/structure`)}
        >
          Continue to website structure
        </Button>
      </div>
    </div>
  );
}
