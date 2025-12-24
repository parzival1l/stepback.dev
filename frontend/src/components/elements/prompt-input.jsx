import React, { Children } from 'react';
import { Loader2, Send, Square, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

export const PromptInput = ({ className, ...props }) => (
  <form
    className={cn(
      "w-full overflow-hidden rounded-xl border border-border bg-background shadow-sm transition-all duration-200 focus-within:border-primary/50 focus-within:shadow-md hover:border-muted-foreground/30",
      className
    )}
    {...props}
  />
);

export const PromptInputTextarea = ({
  onChange,
  className,
  placeholder = "What would you like to know?",
  minHeight = 48,
  maxHeight = 164,
  disableAutoResize = false,
  resizeOnNewLinesOnly = false,
  ...props
}) => {
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      // Don't submit if IME composition is in progress
      if (e.nativeEvent.isComposing) {
        return;
      }

      if (e.shiftKey) {
        // Allow newline
        return;
      }

      // Submit on Enter (without Shift)
      e.preventDefault();
      const form = e.currentTarget.form;
      if (form) {
        form.requestSubmit();
      }
    }
  };

  return (
    <Textarea
      className={cn(
        "w-full resize-none rounded-none border-none p-3 shadow-none outline-hidden ring-0",
        disableAutoResize
          ? "field-sizing-fixed"
          : resizeOnNewLinesOnly
            ? "field-sizing-fixed"
            : "field-sizing-content max-h-[6lh]",
        "bg-transparent",
        "focus-visible:ring-0",
        className
      )}
      name="message"
      onChange={(e) => {
        onChange?.(e);
      }}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      {...props}
    />
  );
};

export const PromptInputToolbar = ({ className, ...props }) => (
  <div
    className={cn("flex items-center justify-between p-2 pt-0", className)}
    {...props}
  />
);

export const PromptInputTools = ({ className, ...props }) => (
  <div
    className={cn(
      "flex items-center gap-1",
      "[&_button:first-child]:rounded-bl-xl",
      className
    )}
    {...props}
  />
);

export const PromptInputButton = ({
  variant = "ghost",
  className,
  size,
  ...props
}) => {
  const newSize =
    (size ?? Children.count(props.children) > 1) ? "default" : "icon";

  return (
    <Button
      className={cn(
        "shrink-0 gap-1.5 rounded-lg",
        variant === "ghost" && "text-muted-foreground hover:text-foreground",
        newSize === "default" && "px-3",
        className
      )}
      size={newSize}
      type="button"
      variant={variant}
      {...props}
    />
  );
};

export const PromptInputSubmit = ({
  className,
  variant = "default",
  size = "icon",
  status,
  children,
  ...props
}) => {
  let Icon = <Send className="size-4" />;

  if (status === "submitted" || status === "loading") {
    Icon = <Loader2 className="size-4 animate-spin" />;
  } else if (status === "streaming") {
    Icon = <Square className="size-4" />;
  } else if (status === "error") {
    Icon = <X className="size-4" />;
  }

  return (
    <Button
      className={cn(
        "gap-1.5 rounded-full h-8 w-8 transition-all duration-200",
        className
      )}
      size={size}
      type="submit"
      variant={variant}
      {...props}
    >
      {children ?? Icon}
    </Button>
  );
};

export const PromptInputActions = ({ className, ...props }) => (
  <div
    className={cn("flex items-center gap-2", className)}
    {...props}
  />
);

