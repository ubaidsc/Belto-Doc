'use client';

import type { Attachment, CreateMessage, Message } from 'ai';
import { useChat } from 'ai/react';
import { AnimatePresence } from 'framer-motion';
import { useState, useCallback } from 'react'; // Import useCallback
import { useWindowSize } from 'usehooks-ts';

import { ChatHeader } from '@/components/chat-header';
import { PreviewMessage, ThinkingMessage } from '@/components/message';
import { useScrollToBottom } from '@/components/use-scroll-to-bottom';

import { Block, type UIBlock } from './block';
import { MultimodalInput } from './multimodal-input';
import { Overview } from './overview';
import { Button } from './ui/button'; // Import Button component

export function Chat({
  id,
  initialMessages,
  selectedModelId,
}: {
  id: string;
  initialMessages: Array<Message>;
  selectedModelId: string;
}) {
  // const { mutate } = useSWRConfig();

  // const {
  //   messages,
  //   setMessages,
  //   handleSubmit,
  //   input,
  //   setInput,
  //   append,
  //   isLoading,
  //   stop,
  //   data: streamingData,
  // } = useChat({
  //   body: { id, modelId: selectedModelId },
  //   initialMessages,
  //   onFinish: () => {
  //     mutate('/api/history');
  //   },
  // });

  const messages = initialMessages; // Use static initial messages
  const setMessages = () => {};
  const handleSubmit = () => {};
  const input = '';
  const setInput = () => {};
  
  const append = async (message: Message | CreateMessage) => {
    if (!message.id) {
      message.id = 'generated-id'; // Provide a default id if undefined
    }
    return null;
  };
  
  const isLoading = false;
  const stop = () => {};
  
  const { width: windowWidth = 1920, height: windowHeight = 1080 } =
    useWindowSize();

  const [block, setBlock] = useState<UIBlock>({
    documentId: 'init',
    content: '',
    title: '',
    status: 'idle',
    isVisible: false,
    boundingBox: {
      top: windowHeight / 4,
      left: windowWidth / 4,
      width: 250,
      height: 50,
    },
  });

  const [messagesContainerRef, messagesEndRef] =
    useScrollToBottom<HTMLDivElement>();

  const [attachments, setAttachments] = useState<Array<Attachment>>([]);

  const toggleBlockVisibility = useCallback(() => {
    setBlock((currentBlock) => {
      if (currentBlock.isVisible === !currentBlock.isVisible) {
        return currentBlock; // No state update needed
      }
      return {
        ...currentBlock,
        isVisible: !currentBlock.isVisible,
      };
    });
  }, []);

  return (
    <>
      <div className="flex flex-col min-w-0 h-dvh bg-background">
        <ChatHeader selectedModelId={selectedModelId} />
        <div
          ref={messagesContainerRef}
          className="flex flex-col min-w-0 gap-6 flex-1 overflow-y-none pt-4"
        >
          {messages.length === 0 && <Overview />}

          {messages.map((message, index) => (
            <PreviewMessage
              key={message.id}
              chatId={id}
              message={message}
              block={block}
              setBlock={setBlock}
              isLoading={isLoading && messages.length - 1 === index}
              vote={undefined} 
            />
          ))}

          {/* Uncomment below for loading indicator */}
          {/* {isLoading &&
            messages.length > 0 &&
            messages[messages.length - 1].role === 'user' && (
              <ThinkingMessage />
            )} */}

          <div
            ref={messagesEndRef}
            className="shrink-0 min-w-[24px] min-h-[24px]"
          />
        </div>
        <form className="flex mx-auto px-4 bg-background pb-4 md:pb-6 gap-2 w-full md:max-w-3xl">
          <MultimodalInput
            chatId={id}
            input={input}
            setInput={setInput}
            handleSubmit={handleSubmit}
            isLoading={isLoading}
            stop={stop}
            attachments={attachments}
            setAttachments={setAttachments}
            messages={messages}
            setMessages={setMessages}
            append={append}
          />
        </form>
        <Button
          variant="outline"
          className="mx-auto mb-4"
          onClick={toggleBlockVisibility} // Use the callback function
        >
          Toggle Block
        </Button>
      </div>

      <AnimatePresence>
        {block.isVisible && ( // Add condition to check if block is visible
          <Block
            chatId={id}
            input={input}
            setInput={setInput}
            handleSubmit={handleSubmit}
            isLoading={isLoading}
            stop={stop}
            attachments={attachments}
            setAttachments={setAttachments}
            append={append}
            block={block}
            setBlock={setBlock}
            messages={messages}
            setMessages={setMessages}
            votes={[]} 
          />
        )}
      </AnimatePresence>

      {/* Uncomment for streaming handler if needed */}
      {/* <BlockStreamHandler streamingData={streamingData} setBlock={setBlock} /> */}
    </>
  );
}