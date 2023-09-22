"use client";
import React, { FC, useCallback, useEffect, useRef, useState } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { useForm } from "react-hook-form";
import { PostCreationRequest, PostValidator } from "@/lib/validators/post";
import { zodResolver } from "@hookform/resolvers/zod";
import type EditorJS from "@editorjs/editorjs";
import { uploadFiles } from "@/lib/uploadthing";
import { toast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { usePathname, useRouter } from "next/navigation";
interface EditorProps {
  subredditId: string;
}
const Editor: FC<EditorProps> = ({ subredditId }) => {
  const ref = useRef<EditorJS>(null);
  const _titleRef = useRef<HTMLTextAreaElement>(null);
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PostCreationRequest>({
    resolver: zodResolver(PostValidator),
    defaultValues: {
      subredditId,
      title: "",
      content: null,
    },
  });

  const initializeEditor = useCallback(async () => {
    const EditorJS = (await import("@editorjs/editorjs")).default;
    const Header = (await import("@editorjs/header")).default;
    const Embed = (await import("@editorjs/embed")).default;
    const Table = (await import("@editorjs/table")).default;
    const List = (await import("@editorjs/list")).default;
    const Code = (await import("@editorjs/code")).default;
    const LinkTool = (await import("@editorjs/link")).default;
    const InlineCode = (await import("@editorjs/inline-code")).default;
    const ImageTool = (await import("@editorjs/image")).default;

    if (!ref.current) {
      const editorjs = new EditorJS({
        holder: "editor",
        onReady() {
          ref.current = editor;
        },
        placeholder: "Type here to write your post...",
        inlineToolbar: true,
        data: { blocks: [] },
        tools: {
          header: Header,
          embed: Embed,
          table: Table,
          list: List,
          code: Code,
          linkTool: {
            class: LinkTool,
            config: {
              endpoint: "/api/link",
            },
          },
          inlineCode: InlineCode,
          image: {
            class: ImageTool,
            config: {
              uploader: {
                async uploadByFile(file: File) {
                  const [res] = await uploadFiles([file], "imageUploader");
                  return {
                    success: 1,
                    file: {
                      url: res.fileUrl,
                    },
                  };
                },
              },
            },
          },
        },
      });
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsMounted(true);
    }
  }, []);
  useEffect(() => {
    if (Object.keys(errors).length) {
      for (const [_key, value] of Object.entries(errors)) {
        toast({
          title: "Something went wrong",
          description: (value as { message: string }).message,
        });
      }
    }
  }, [errors]);

  const { mutate: createPost } = useMutation({
    mutationFn: async ({
      title,
      content,
      subredditId,
    }: PostCreationRequest) => {
      const payload: PostCreationRequest = {
        title,
        content,
        subredditId,
      };
      const { data } = await axios.post("/api/subreddit/post/create", payload);
      return data;
    },
    onError: () => {
      return toast({
        title: "Something went wrong",
        description: "Your post was not created. Please try again later",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      const newPathName = pathname.split("/").slice(0, -1).join("/");
      router.push(newPathName);
      router.refresh();
      return toast({
        title: "Successfully created post",
        description: "Your post was created successfully",
        variant: "default",
      });
    },
  });

  async function onSubmit(data: PostCreationRequest) {
    const blocks = await ref.current?.save
    const payload: PostCreationRequest = {
      subredditId: data.subredditId,
      title: data.title,
      content: blocks,
    };
    createPost(payload);
  }
  useEffect(() => {
    const init = async () => {
      await initializeEditor();
      setTimeout(() => {
        _titleRef.current?.focus();
      });
    };
    if (isMounted) {
      init();
    }
    return () => {
      ref.current?.destroy
    };
  }, [isMounted, initializeEditor]);

  const { ref: titleRef, ...rest } = register("title");
  return (
    <div className="w-full p-4 bg-zinc-50 rounded-lg border border-zinc-200">
      <form
        id="subreddit-post-form"
        className="w-fit"
        onSubmit={handleSubmit(onSubmit)}
      >
        <div className="prose prose-stone dark:prose-invert">
          <TextareaAutosize
            ref={(e) => {
              titleRef(e);
              // @ts-ignore
              _titleRef.current = e;
            }}
            {...rest}
            placeholder="title"
            className="w-full resize-none appearance-none overflow-hidden bg-transparent text-5xl font-bold focus:outline-none"
          />
          <div id="editor" className="min-h-[500px]" />
        </div>
      </form>
    </div>
  );
};

export default Editor;
