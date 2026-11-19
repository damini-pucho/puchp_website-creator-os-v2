import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Button, StatusPill, EmptyState } from '../components/ui/Cards';
import { SectionLabel, Chip, ChipRow, IconButton, Field, TextInput, TextArea, Tag } from '../components/ui/primitives';
import { useData } from '../context/DataContext';
import { Edit2, Layout, Plus, Trash, Save, X } from 'lucide-react';
import { toast } from 'sonner';

const statusWord = (page) => (page.status === 'published' ? 'Published' : 'Draft');

export default function PagesList() {
  const { clientId } = useParams();
  const { pages, pageBlocks } = useData();
  const [selectedPage, setSelectedPage] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [typeFilter, setTypeFilter] = useState('all');

const handleEditPage = (page) => {
    setSelectedPage(page);
    // Load blocks from the database or fall back to default stub blocks
    const existing = pageBlocks.find(pb => pb.page_id === page.id);
    const pageContentBlocks = existing ? existing.blocks : null;
    const fallbackBlocks = pageContentBlocks || [
      { id: 'b1', type: 'Hero Block', heading: `Welcome to ${page.title}`, text: `This is a template block targeting the keyword "${page.keyword}". Feel free to edit this body content.` },
      { id: 'b2', type: 'Feature Block', heading: 'Core Features & Benefits', text: 'Detail the primary customer benefits and local service coordinates here.' },
      { id: 'b3', type: 'Call to Action', heading: 'Register / Get in Touch', text: 'Call to action text block to capture incoming customer inquiries.' }
    ];
    setBlocks(fallbackBlocks);
  };

  const handleBlockChange = (id, field, value) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  const addBlock = () => {
    const newBlock = {
      id: `b-${Date.now()}`,
      type: 'Text Section',
      heading: 'New Content Heading',
      text: 'Describe services, locations or company certification benchmarks here.'
    };
    setBlocks(prev => [...prev, newBlock]);
    toast.success('New content block added.');
  };

  const deleteBlock = (id) => {
    setBlocks(prev => prev.filter(b => b.id !== id));
    toast.error('Content block deleted.');
  };

  const savePageContent = () => {
    toast.success('Page copy updated and saved in memory!');
    setSelectedPage(null);
  };

  // Filter chips: one per page type that exists (service / landing / blog …), each with its count.
  const types = [...new Set(pages.map((p) => p.type).filter(Boolean))];
  const visiblePages = typeFilter === 'all' ? pages : pages.filter((p) => p.type === typeFilter);

  return (
    <div className="space-y-6">
      {!selectedPage ? (
        <div className="space-y-4">
          <SectionLabel count={pages.length}>Page copy</SectionLabel>
          <p className="text-sm text-ink-3 -mt-2">Edit headings and body blocks for each page on the site.</p>

          {pages.length > 0 && (
            <ChipRow>
              <Chip selected={typeFilter === 'all'} count={pages.length} onClick={() => setTypeFilter('all')}>All</Chip>
              {types.map((t) => (
                <Chip key={t} selected={typeFilter === t} count={pages.filter((p) => p.type === t).length} onClick={() => setTypeFilter(t)}>
                  <span className="capitalize">{t}</span>
                </Chip>
              ))}
            </ChipRow>
          )}

          {pages.length === 0 ? (
            <EmptyState
              icon={Layout}
              title="No pages yet"
              description="Pages appear here once the site build creates them. Then you can edit each page's copy block by block."
            />
          ) : (
            <Card padded={false} className="overflow-hidden">
              {/* table — 640 px and up */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left text-[13px]">
                  <thead className="bg-surface-2 border-b border-line">
                    <tr>
                      <th className="label-mono px-4 py-3 font-normal">Page</th>
                      <th className="label-mono px-4 py-3 font-normal">Type</th>
                      <th className="label-mono px-4 py-3 font-normal">Target keyword</th>
                      <th className="label-mono px-4 py-3 font-normal">Status</th>
                      <th className="label-mono px-4 py-3 font-normal">Updated</th>
                      <th className="label-mono px-4 py-3 font-normal text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line-soft">
                    {visiblePages.map((page) => (
                      <tr key={page.id} className="hover:bg-hover transition-colors duration-150">
                        <td className="px-4 py-3 font-medium text-ink">{page.title}</td>
                        <td className="px-4 py-3"><Tag className="capitalize">{page.type}</Tag></td>
                        <td className="px-4 py-3 text-ink-2">{page.keyword}</td>
                        <td className="px-4 py-3"><StatusPill status={statusWord(page)} /></td>
                        <td className="px-4 py-3 text-ink-3 tabular-nums whitespace-nowrap">{page.lastUpdated}</td>
                        <td className="px-4 py-3 text-right">
                          <Button variant="secondary" size="sm" icon={Edit2} onClick={() => handleEditPage(page)}>
                            Edit copy
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* stacked cards — under 640 px */}
              <ul className="sm:hidden divide-y divide-line-soft">
                {visiblePages.map((page) => (
                  <li key={page.id} className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-medium text-ink min-w-0 break-words">{page.title}</p>
                      <StatusPill status={statusWord(page)} />
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-ink-3">
                      <Tag className="capitalize">{page.type}</Tag>
                      {page.keyword && <span className="text-ink-2">{page.keyword}</span>}
                      {page.lastUpdated && <span className="tabular-nums">· {page.lastUpdated}</span>}
                    </div>
                    <Button variant="secondary" icon={Edit2} onClick={() => handleEditPage(page)} className="w-full">
                      Edit copy
                    </Button>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      ) : (
        /* Block editor */
        <div className="space-y-5 max-w-4xl mx-auto animate-fade-in">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <span className="w-9 h-9 rounded-xl bg-surface-2 text-ink-2 flex items-center justify-center shrink-0">
                <Layout className="w-[18px] h-[18px]" strokeWidth={1.7} aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="label-mono">Editing page</p>
                <h3 className="text-[17px] leading-6 font-semibold text-ink break-words">{selectedPage.title}</h3>
                {selectedPage.keyword && <p className="text-xs text-ink-3 mt-0.5">Target keyword: <span className="text-ink-2">{selectedPage.keyword}</span></p>}
              </div>
            </div>
            <IconButton icon={X} label="Close editor" onClick={() => setSelectedPage(null)} />
          </div>

          <div className="space-y-4">
            {blocks.map((block, idx) => (
              <Card key={block.id} className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="label-mono min-w-0 truncate">Section {idx + 1} · {block.type}</p>
                  <IconButton
                    icon={Trash}
                    label="Delete block"
                    className="-mr-2 -my-1 hover:text-bad-text hover:bg-bad-soft"
                    onClick={() => deleteBlock(block.id)}
                  />
                </div>

                <Field label="Section heading" htmlFor={`heading-${block.id}`}>
                  <TextInput
                    id={`heading-${block.id}`}
                    type="text"
                    value={block.heading}
                    onChange={e => handleBlockChange(block.id, 'heading', e.target.value)}
                  />
                </Field>
                <Field label="Body copy" htmlFor={`text-${block.id}`}>
                  <TextArea
                    id={`text-${block.id}`}
                    rows={4}
                    value={block.text}
                    onChange={e => handleBlockChange(block.id, 'text', e.target.value)}
                  />
                </Field>
              </Card>
            ))}
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-1">
            <Button variant="secondary" icon={Plus} onClick={addBlock}>
              Add block
            </Button>
            <Button icon={Save} onClick={savePageContent}>
              Save page copy
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
