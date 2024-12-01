import type {
  Attachment,
  ChatRequestOptions,
  CreateMessage,
  Message,
} from 'ai';
import cx from 'classnames';
import { formatDistance } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { toast } from 'sonner';
import useSWR, { useSWRConfig } from 'swr';
import {
  useCopyToClipboard,
  useDebounceCallback,
  useWindowSize,
} from 'usehooks-ts';

import type { Document, Suggestion, Vote } from '@/lib/db/schema';
import { fetcher } from '@/lib/utils';

import { DiffView } from './diffview';
import { DocumentSkeleton } from './document-skeleton';
import { Editor } from './editor';
import { CopyIcon, CrossIcon, DeltaIcon, RedoIcon, UndoIcon } from './icons';
import { PreviewMessage } from './message';
import { MultimodalInput } from './multimodal-input';
import { Toolbar } from './toolbar';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { useScrollToBottom } from './use-scroll-to-bottom';
import { VersionFooter } from './version-footer';
export interface UIBlock {
  title: string;
  documentId: string;
  content: string;
  isVisible: boolean;
  status: 'streaming' | 'idle';
  boundingBox: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
}

export function Block({
  chatId,
  input,
  setInput,
  handleSubmit,
  isLoading,
  stop,
  attachments,
  setAttachments,
  append,
  block,
  setBlock,
  messages,
  setMessages,
  votes,
}: {
  chatId: string;
  input: string;
  setInput: (input: string) => void;
  isLoading: boolean;
  stop: () => void;
  attachments: Array<Attachment>;
  setAttachments: Dispatch<SetStateAction<Array<Attachment>>>;
  block: UIBlock;
  setBlock: Dispatch<SetStateAction<UIBlock>>;
  messages: Array<Message>;
  setMessages: Dispatch<SetStateAction<Array<Message>>>;
  votes: Array<Vote> | undefined;
  append: (
    message: Message | CreateMessage,
    chatRequestOptions?: ChatRequestOptions,
  ) => Promise<string | null | undefined>;
  handleSubmit: (
    event?: {
      preventDefault?: () => void;
    },
    chatRequestOptions?: ChatRequestOptions,
  ) => void;
}) {
  const [messagesContainerRef, messagesEndRef] =
    useScrollToBottom<HTMLDivElement>();

  // Commenting out API calls and using demo data
  // const {
  //   data: documents,
  //   isLoading: isDocumentsFetching,
  //   mutate: mutateDocuments,
  // } = useSWR<Array<Document>>(
  //   block && block.status !== 'streaming'
  //     ? `/api/document?id=${block.documentId}`
  //     : null,
  //   fetcher,
  // );

  // const { data: suggestions } = useSWR<Array<Suggestion>>(
  //   documents && block && block.status !== 'streaming'
  //     ? `/api/suggestions?documentId=${block.documentId}`
  //     : null,
  //   fetcher,
  //   {
  //     dedupingInterval: 5000,
  //   },
  // );

  const documents = [
    {
      id: '1',
      title: 'Demo Document 1',
      content: 'This is the content of the first demo document.',
      createdAt: new Date('2023-10-01T10:00:00Z'),
      userId: 'user1',
    },
    {
      id: '2',
      title: 'Demo Document 2',
      content: `Climate Change and Its Effects Climate change is one of the most pressing challenges facing the world today. It refers to long-term alterations in temperature, precipitation, wind patterns, and other elements of the Earth's climate system. These changes are largely driven by human activities, particularly the burning of fossil fuels, deforestation, and industrial processes that release greenhouse gases (GHGs) into the atmosphere. This essay explores the causes of climate change, its wide-ranging impacts, and the urgent need for mitigation and adaptation strategies.  Causes of Climate Change The primary driver of climate change is the increase in greenhouse gases such as carbon dioxide (CO₂), methane (CH₄), and nitrous oxide (N₂O). These gases trap heat in the Earth's atmosphere, creating a "greenhouse effect" that leads to global warming. Human activities since the Industrial Revolution have significantly increased the concentration of these gases.  Burning Fossil Fuels: The combustion of coal, oil, and natural gas for energy and transportation is the largest source of CO₂ emissions. Deforestation: Trees absorb CO₂, and their removal reduces the Earth's capacity to regulate carbon levels. Agriculture and Industrial Activities: Livestock farming releases methane, while industrial processes emit various GHGs. Natural processes such as volcanic eruptions and variations in solar radiation also influence the climate but are not the primary drivers of the current changes.  Effects of Climate Change The impacts of climate change are already evident and are expected to intensify in the coming decades. These effects are global in scale, affecting ecosystems, economies, and human health.  Rising Temperatures: Global temperatures have increased by approximately 1.1°C since the late 19th century. This warming has led to more frequent and intense heatwaves, disrupting ecosystems and human livelihoods.  Melting Ice and Rising Sea Levels: The polar ice caps and glaciers are melting at alarming rates, contributing to rising sea levels. Low-lying coastal areas and small island nations are particularly vulnerable to flooding and erosion, threatening millions of lives and livelihoods.  Extreme Weather Events: Climate change has increased the frequency and severity of extreme weather events such as hurricanes, droughts, and wildfires. These events cause significant damage to infrastructure, disrupt food and water supplies, and lead to economic losses.  Ecosystem Disruption: Many species are unable to adapt quickly to changing climates, leading to shifts in biodiversity. Coral reefs, for example, are dying due to ocean warming and acidification, impacting marine life and communities that depend on fishing.  Impact on Human Health: Rising temperatures and changing weather patterns contribute to the spread of diseases such as malaria and dengue fever. Heatwaves pose direct health risks, particularly for vulnerable populations like the elderly and those with pre-existing conditions.  Economic Consequences: Climate change exacerbates poverty and inequality, particularly in developing countries that lack resources to cope with its impacts. Damage to infrastructure, loss of agricultural productivity, and increased healthcare costs place immense strain on economies.`,
      createdAt: new Date('2023-10-02T10:00:00Z'),
      userId: 'user2',
    },
  ];

  const suggestions = [
    {
      id: '1',
      documentId: '1',
      content: 'This is a suggestion for the first demo document.',
      createdAt: new Date('2023-10-01T12:00:00Z'),
      description: 'Suggestion description for the first demo document.',
      userId: 'user1',
      documentCreatedAt: new Date('2023-10-01T10:00:00Z'),
      originalText: 'Original text of the first demo document.',
      suggestedText: 'This is a suggestion for the first demo document.',
      isResolved: false,
    },
    {
      id: '2',
      documentId: '2',
      createdAt: new Date('2023-10-02T10:00:00Z'),
      content: 'This is a suggestion for the second demo document.',
      description: 'Suggestion description for the second demo document.',
      userId: 'user2',
      documentCreatedAt: new Date('2023-10-02T10:00:00Z'),
      originalText: 'Original text of the second demo document.',
      suggestedText: 'This is a suggestion for the second demo document.',
      isResolved: false,
    },
  ];

  const [mode, setMode] = useState<'edit' | 'diff'>('edit');
  const [document, setDocument] = useState<Document | null>(null);
  const [currentVersionIndex, setCurrentVersionIndex] = useState(-1);

  useEffect(() => {
    if (documents && documents.length > 0) {
      const mostRecentDocument = documents.at(-1);

      if (mostRecentDocument && mostRecentDocument.id !== document?.id) { // Add condition to check if document is already set
        setDocument(mostRecentDocument);
        setCurrentVersionIndex(documents.length - 1);
        setBlock((currentBlock) => {
          if (currentBlock.content === mostRecentDocument.content) {
            return currentBlock; // No state update needed
          }
          return {
            ...currentBlock,
            content: mostRecentDocument.content ?? '',
          };
        });
      }
    }
  }, [documents, setBlock]);

  // useEffect(() => {
  //   mutateDocuments();
  // }, [block.status, mutateDocuments]);

  const { mutate } = useSWRConfig();
  const [isContentDirty, setIsContentDirty] = useState(false);

  const handleContentChange = useCallback(
    (updatedContent: string) => {
      if (!block) return;

      // mutate<Array<Document>>(
      //   `/api/document?id=${block.documentId}`,
      //   async (currentDocuments) => {
      //     if (!currentDocuments) return undefined;

      //     const currentDocument = currentDocuments.at(-1);

      //     if (!currentDocument || !currentDocument.content) {
      //       setIsContentDirty(false);
      //       return currentDocuments;
      //     }

      //     if (currentDocument.content !== updatedContent) {
      //       await fetch(`/api/document?id=${block.documentId}`, {
      //         method: 'POST',
      //         body: JSON.stringify({
      //           title: block.title,
      //           content: updatedContent,
      //         }),
      //       });

      //       setIsContentDirty(false);

      //       const newDocument = {
      //         ...currentDocument,
      //         content: updatedContent,
      //         createdAt: new Date(),
      //       };

      //       return [...currentDocuments, newDocument];
      //     }
      //     return currentDocuments;
      //   },
      //   { revalidate: false },
      // );
    },
    [block],
  );

  const debouncedHandleContentChange = useDebounceCallback(
    handleContentChange,
    2000,
  );

  const saveContent = useCallback(
    (updatedContent: string, debounce: boolean) => {
      if (document && updatedContent !== document.content) {
        setIsContentDirty(true);

        if (debounce) {
          debouncedHandleContentChange(updatedContent);
        } else {
          handleContentChange(updatedContent);
        }
      }
    },
    [document, debouncedHandleContentChange, handleContentChange],
  );

  function getDocumentContentById(index: number) {
    if (!documents) return '';
    if (!documents[index]) return '';
    return documents[index].content ?? '';
  }

  const handleVersionChange = (type: 'next' | 'prev' | 'toggle' | 'latest') => {
    if (!documents) return;

    if (type === 'latest') {
      setCurrentVersionIndex(documents.length - 1);
      setMode('edit');
    }

    if (type === 'toggle') {
      setMode((mode) => (mode === 'edit' ? 'diff' : 'edit'));
    }

    if (type === 'prev') {
      if (currentVersionIndex > 0) {
        setCurrentVersionIndex((index) => index - 1);
      }
    } else if (type === 'next') {
      if (currentVersionIndex < documents.length - 1) {
        setCurrentVersionIndex((index) => index + 1);
      }
    }
  };

  const [isToolbarVisible, setIsToolbarVisible] = useState(false);

  /*
   * NOTE: if there are no documents, or if
   * the documents are being fetched, then
   * we mark it as the current version.
   */

  const isCurrentVersion =
    documents && documents.length > 0
      ? currentVersionIndex === documents.length - 1
      : true;

  const { width: windowWidth, height: windowHeight } = useWindowSize();
  const isMobile = windowWidth ? windowWidth < 768 : false;

  const [_, copyToClipboard] = useCopyToClipboard();

  return (
    <motion.div
      className="flex flex-row h-dvh w-dvw fixed top-0 left-0 z-50 bg-muted"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { delay: 0.4 } }}
    >
      {!isMobile && (
        <motion.div
          className="relative w-[400px] bg-muted dark:bg-background h-dvh shrink-0"
          initial={{ opacity: 0, x: 10, scale: 1 }}
          animate={{
            opacity: 1,
            x: 0,
            scale: 1,
            transition: {
              delay: 0.2,
              type: 'spring',
              stiffness: 200,
              damping: 30,
            },
          }}
          exit={{
            opacity: 0,
            x: 0,
            scale: 0.95,
            transition: { delay: 0 },
          }}
        >
          <AnimatePresence>
            {!isCurrentVersion && (
              <motion.div
                className="left-0 absolute h-dvh w-[400px] top-0 bg-zinc-900/50 z-50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            )}
          </AnimatePresence>

          <div className="flex flex-col h-full justify-between items-center gap-4">
            <div
              ref={messagesContainerRef}
              className="flex flex-col gap-4 h-full items-center overflow-y-none px-4 pt-20"
            >
              {messages.map((message, index) => (
                <PreviewMessage
                  chatId={chatId}
                  key={message.id}
                  message={message}
                  block={block}
                  setBlock={setBlock}
                  isLoading={isLoading && index === messages.length - 1}
                  vote={
                    votes
                      ? votes.find((vote) => vote.messageId === message.id)
                      : undefined
                  }
                />
              ))}

              <div
                ref={messagesEndRef}
                className="shrink-0 min-w-[24px] min-h-[24px]"
              />
            </div>

            <form className="flex flex-row gap-2 relative items-end w-full px-4 pb-4">
              <MultimodalInput
                chatId={chatId}
                input={input}
                setInput={setInput}
                handleSubmit={handleSubmit}
                isLoading={isLoading}
                stop={stop}
                attachments={attachments}
                setAttachments={setAttachments}
                messages={messages}
                append={append}
                className="bg-background dark:bg-muted"
                setMessages={setMessages}
              />
            </form>
          </div>
        </motion.div>
      )}

      <motion.div
        className="fixed dark:bg-muted bg-background h-dvh flex flex-col shadow-xl overflow-y-scroll"
        initial={
          isMobile
            ? {
                opacity: 0,
                x: 0,
                y: 0,
                width: windowWidth,
                height: windowHeight,
                borderRadius: 50,
              }
            : {
                opacity: 0,
                x: block.boundingBox.left,
                y: block.boundingBox.top,
                height: block.boundingBox.height,
                width: block.boundingBox.width,
                borderRadius: 50,
              }
        }
        animate={
          isMobile
            ? {
                opacity: 1,
                x: 0,
                y: 0,
                width: windowWidth,
                height: '100dvh',
                borderRadius: 0,
                transition: {
                  delay: 0,
                  type: 'spring',
                  stiffness: 200,
                  damping: 30,
                },
              }
            : {
                opacity: 1,
                x: 400,
                y: 0,
                height: windowHeight,
                width: windowWidth ? windowWidth - 400 : 'calc(100dvw-400px)',
                borderRadius: 0,
                transition: {
                  delay: 0,
                  type: 'spring',
                  stiffness: 200,
                  damping: 30,
                },
              }
        }
        exit={{
          opacity: 0,
          scale: 0.5,
          transition: {
            delay: 0.1,
            type: 'spring',
            stiffness: 600,
            damping: 30,
          },
        }}
      >
        <div className="p-2 flex flex-row justify-between items-start">
          <div className="flex flex-row gap-4 items-start">
            <Button
              variant="outline"
              className="h-fit p-2 dark:hover:bg-zinc-700"
              onClick={() => {
                setBlock((currentBlock) => ({
                  ...currentBlock,
                  isVisible: false,
                }));
              }}
            >
              <CrossIcon size={18} />
            </Button>

            <div className="flex flex-col">
              <div className="font-medium">
                {document?.title ?? block.title}
              </div>

              {isContentDirty ? (
                <div className="text-sm text-muted-foreground">
                  Saving changes...
                </div>
              ) : document ? (
                <div className="text-sm text-muted-foreground">
                  {`Updated ${formatDistance(
                    new Date(document.createdAt),
                    new Date(),
                    {
                      addSuffix: true,
                    },
                  )}`}
                </div>
              ) : (
                <div className="w-32 h-3 mt-2 bg-muted-foreground/20 rounded-md animate-pulse" />
              )}
            </div>
          </div>

          <div className="flex flex-row gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  className="p-2 h-fit dark:hover:bg-zinc-700"
                  onClick={() => {
                    copyToClipboard(block.content);
                    toast.success('Copied to clipboard!');
                  }}
                  disabled={block.status === 'streaming'}
                >
                  <CopyIcon size={18} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Copy to clipboard</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  className="p-2 h-fit dark:hover:bg-zinc-700 !pointer-events-auto"
                  onClick={() => {
                    handleVersionChange('prev');
                  }}
                  disabled={
                    currentVersionIndex === 0 || block.status === 'streaming'
                  }
                >
                  <UndoIcon size={18} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>View Previous version</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  className="p-2 h-fit dark:hover:bg-zinc-700 !pointer-events-auto"
                  onClick={() => {
                    handleVersionChange('next');
                  }}
                  disabled={isCurrentVersion || block.status === 'streaming'}
                >
                  <RedoIcon size={18} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>View Next version</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  className={cx(
                    'p-2 h-fit !pointer-events-auto dark:hover:bg-zinc-700',
                    {
                      'bg-muted': mode === 'diff',
                    },
                  )}
                  onClick={() => {
                    handleVersionChange('toggle');
                  }}
                  disabled={
                    block.status === 'streaming' || currentVersionIndex === 0
                  }
                >
                  <DeltaIcon size={18} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>View changes</TooltipContent>
            </Tooltip>
          </div>
        </div>

        <div className="prose dark:prose-invert dark:bg-muted bg-background h-full overflow-y-scroll px-4 py-8 md:p-20 !max-w-full pb-40 items-center">
          <div className="flex flex-row max-w-[600px] mx-auto">
            {mode === 'edit' ? (
              <Editor
                content={
                  isCurrentVersion
                    ? block.content
                    : getDocumentContentById(currentVersionIndex)
                }
                isCurrentVersion={isCurrentVersion}
                currentVersionIndex={currentVersionIndex}
                status={block.status}
                saveContent={saveContent}
                suggestions={isCurrentVersion ? suggestions : []}
              />
            ) : (
              <DiffView
                oldContent={getDocumentContentById(currentVersionIndex - 1)}
                newContent={getDocumentContentById(currentVersionIndex)}
              />
            )}

            {suggestions ? (
              <div className="md:hidden h-dvh w-12 shrink-0" />
            ) : null}

            <AnimatePresence>
              {isCurrentVersion && (
                <Toolbar
                  isToolbarVisible={isToolbarVisible}
                  setIsToolbarVisible={setIsToolbarVisible}
                  append={append}
                  isLoading={isLoading}
                  stop={stop}
                  setMessages={setMessages}
                />
              )}
            </AnimatePresence>
          </div>
        </div>

        <AnimatePresence>
          {!isCurrentVersion && (
            <VersionFooter
              block={block}
              currentVersionIndex={currentVersionIndex}
              documents={documents}
              handleVersionChange={handleVersionChange}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
