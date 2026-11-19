import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Button, EmptyState } from '../components/ui/Cards';
import { CardHeader, SectionLabel, IconButton, Modal, Field, TextArea } from '../components/ui/primitives';
import Input from '../components/ui/Input';
import { useData } from '../context/DataContext';
import { Image, UploadCloud, Sparkles, Edit2, Save, Trash } from 'lucide-react';
import { toast } from 'sonner';

export default function MediaLibrary() {
  const { clientId } = useParams();
  const { mediaFiles, addMediaFile } = useData();
  const [mediaList, setMediaList] = useState(mediaFiles);
  const [generating, setGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');

  // Sync with the database when data changes
  React.useEffect(() => { setMediaList(mediaFiles); }, [mediaFiles]);

  // Alt text editor states
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [altText, setAltText] = useState('');

  const handleUpload = () => {
    // Placeholder: trigger a real file input upload
    toast.info('Upload feature ready — real file upload pending file storage integration.');
  };

  const handleGenerateAiImage = (e) => {
    e.preventDefault();
    if (!aiPrompt.trim()) {
      toast.error('Please enter a description for the AI image.');
      return;
    }

    setGenerating(true);
    toast.info('AI Generation Agent triggered...');

    setTimeout(() => {
      // AI generation — placeholder until file storage integration
      toast.info('AI image generation queued. Real image will be stored in the media library.');
      setGenerating(false);
      setAiPrompt('');
    }, 2500);
  };

  const startEditAltText = (media) => {
    setSelectedMedia(media);
    setAltText(media.alt);
  };

  const saveAltText = () => {
    if (!selectedMedia) return;
    setMediaList(prev => prev.map(m => m.id === selectedMedia.id ? { ...m, alt: altText } : m));
    setSelectedMedia(null);
    toast.success('AI Alt Text updated successfully!');
  };

  const deleteMedia = (id) => {
    setMediaList(prev => prev.filter(m => m.id !== id));
    toast.error('Media asset deleted.');
  };

  return (
    <div className="space-y-6">

      {/* Upload and AI generation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">

        <button
          type="button"
          onClick={handleUpload}
          className="md:col-span-1 min-h-[160px] border-2 border-dashed border-line-strong bg-surface-2 hover:bg-hover hover:border-ink-3 p-6 rounded-2xl flex flex-col items-center justify-center text-center gap-1 transition-colors duration-150"
        >
          <span className="w-10 h-10 rounded-xl bg-surface text-ink-2 flex items-center justify-center mb-1">
            <UploadCloud className="w-5 h-5" strokeWidth={1.7} aria-hidden />
          </span>
          <span className="text-sm font-medium text-ink">Upload client graphics</span>
          <span className="text-xs text-ink-3">PNG, JPG or WebP, up to 5 MB</span>
        </button>

        <Card className="md:col-span-2 flex flex-col gap-4 justify-between">
          <CardHeader
            icon={Sparkles}
            title="Generate an image with AI"
            description="Describe the visual. The generated image gets SEO alt text automatically."
          />

          <form onSubmit={handleGenerateAiImage} className="flex flex-col sm:flex-row gap-3 sm:items-end">
            <div className="flex-1 min-w-0">
              <Input
                label="Image description"
                placeholder="e.g. Saffron fields under mist in Kashmir, landscape photo"
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                disabled={generating}
              />
            </div>
            <Button
              icon={Sparkles}
              size="lg"
              disabled={generating}
              loading={generating}
              type="submit"
            >
              {generating ? 'Generating…' : 'Generate'}
            </Button>
          </form>
        </Card>

      </div>

      {/* Media grid */}
      <section className="space-y-3">
        <SectionLabel count={mediaList.length}>Media</SectionLabel>
        {mediaList.length === 0 ? (
          <EmptyState
            icon={Image}
            title="No media yet"
            description="Upload the client's graphics or generate an image with AI above. Files you add show here with their alt text."
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 animate-fade-in">
            {mediaList.map((media) => (
              <Card key={media.id} padded={false} className="p-2 flex flex-col gap-2 min-w-0">
                <div className="aspect-[4/3] rounded-xl overflow-hidden bg-surface-2">
                  <img src={media.url} alt={media.alt} referrerPolicy="no-referrer" loading="lazy" className="w-full h-full object-cover" />
                </div>

                <div className="min-w-0 px-1.5 pt-0.5">
                  <p className="text-[13px] font-medium text-ink truncate">{media.name}</p>
                  <p className="text-xs text-ink-3 truncate tabular-nums">{media.size}</p>
                </div>
                <div className="flex items-center justify-end gap-0.5 border-t border-line-soft pt-1">
                  <IconButton icon={Edit2} label="Edit alt text" onClick={() => startEditAltText(media)} />
                  <IconButton icon={Trash} label="Delete file" onClick={() => deleteMedia(media.id)} className="hover:text-bad-text hover:bg-bad-soft" />
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Alt text editor */}
      <Modal
        open={!!selectedMedia}
        onClose={() => setSelectedMedia(null)}
        title="Alt text"
        description={selectedMedia?.name}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setSelectedMedia(null)}>Cancel</Button>
            <Button icon={Save} onClick={saveAltText}>Save alt text</Button>
          </>
        }
      >
        {selectedMedia && (
          <div className="space-y-4">
            <div className="aspect-video rounded-xl overflow-hidden bg-surface-2">
              <img src={selectedMedia.url} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
            </div>
            <Field label="AI-generated alt text" htmlFor="media-alt-text" hint="Describe the image for search engines and screen readers.">
              <TextArea
                id="media-alt-text"
                rows={4}
                value={altText}
                onChange={e => setAltText(e.target.value)}
                placeholder="Describe this image…"
              />
            </Field>
          </div>
        )}
      </Modal>

    </div>
  );
}
