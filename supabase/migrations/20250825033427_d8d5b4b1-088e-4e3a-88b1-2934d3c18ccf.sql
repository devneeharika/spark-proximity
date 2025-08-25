-- Create messages table for chat functionality
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text',
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create policies for messages
CREATE POLICY "Users can view their own conversations" 
ON public.messages 
FOR SELECT 
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages to their connections" 
ON public.messages 
FOR INSERT 
WITH CHECK (
  auth.uid() = sender_id AND 
  EXISTS (
    SELECT 1 FROM public.connections 
    WHERE status = 'accepted' 
    AND ((requester_id = auth.uid() AND receiver_id = messages.receiver_id) 
         OR (receiver_id = auth.uid() AND requester_id = messages.receiver_id))
  )
);

CREATE POLICY "Users can update their own messages read status" 
ON public.messages 
FOR UPDATE 
USING (auth.uid() = receiver_id)
WITH CHECK (auth.uid() = receiver_id);

-- Create trigger for updated_at
CREATE TRIGGER update_messages_updated_at
BEFORE UPDATE ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_messages_conversation ON public.messages(sender_id, receiver_id, created_at);
CREATE INDEX idx_messages_unread ON public.messages(receiver_id, read_at) WHERE read_at IS NULL;

-- Enable realtime for messages
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;