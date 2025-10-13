'use client';

import React, { useState, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Bold, Italic, Underline, Strikethrough, Code, Link,
  List, ListOrdered, Quote, Minus, Undo, Redo,
  Type, Languages, Mic, Volume2, Image, Video,
  Save, Eye, Settings, Palette, AlignLeft, AlignCenter,
  AlignRight, Heading1, Heading2, Heading3, FileText,
  Sparkles, Brain, CheckCircle, AlertCircle, Info
} from 'lucide-react';
import { toast } from 'sonner';
import { AIContentAssistant } from '@/components/ai/AIContentAssistant';
import { AITooltips } from '@/components/ai/AITooltips';

interface TahitianRichEditorProps {
  className?: string;
  initialContent?: string;
  onSave?: (content: string) => void;
  onPreview?: (content: string) => void;
}

interface TahitianCharacter {
  character: string;
  name: string;
  description: string;
  category: 'vowel' | 'consonant' | 'special';
}

interface ContentTemplate {
  id: string;
  name: string;
  description: string;
  content: string;
  type: 'lesson' | 'exercise' | 'quiz' | 'story';
}

const TahitianRichEditor = React.memo(function TahitianRichEditor({ 
  className, 
  initialContent = '', 
  onSave, 
  onPreview 
}: TahitianRichEditorProps) {
  const [activeTab, setActiveTab] = useState('editor');
  const [wordCount, setWordCount] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);

  // Tahitian special characters
  const tahitianCharacters: TahitianCharacter[] = [
    { character: 'ā', name: 'a macron', description: 'Long a sound', category: 'vowel' },
    { character: 'ē', name: 'e macron', description: 'Long e sound', category: 'vowel' },
    { character: 'ī', name: 'i macron', description: 'Long i sound', category: 'vowel' },
    { character: 'ō', name: 'o macron', description: 'Long o sound', category: 'vowel' },
    { character: 'ū', name: 'u macron', description: 'Long u sound', category: 'vowel' },
    { character: "'", name: 'okina', description: 'Glottal stop', category: 'special' },
    { character: 'Ā', name: 'A macron', description: 'Capital long a', category: 'vowel' },
    { character: 'Ē', name: 'E macron', description: 'Capital long e', category: 'vowel' },
    { character: 'Ī', name: 'I macron', description: 'Capital long i', category: 'vowel' },
    { character: 'Ō', name: 'O macron', description: 'Capital long o', category: 'vowel' },
    { character: 'Ū', name: 'U macron', description: 'Capital long u', category: 'vowel' }
  ];

  // Content templates
  const contentTemplates: ContentTemplate[] = [
    {
      id: 'greeting-lesson',
      name: 'Greeting Lesson',
      description: 'Basic structure for greeting lessons',
      type: 'lesson',
      content: `<h2>Tahitian Greetings</h2>
<p>In this lesson, we'll learn essential Tahitian greetings and polite expressions.</p>

<h3>Key Vocabulary</h3>
<ul>
  <li><strong>Ia ora na</strong> - Hello/Good day</li>
  <li><strong>Nana</strong> - Goodbye</li>
  <li><strong>Mauruuru</strong> - Thank you</li>
</ul>

<h3>Practice</h3>
<p>Try using these greetings in different contexts...</p>`
    },
    {
      id: 'vocabulary-exercise',
      name: 'Vocabulary Exercise',
      description: 'Template for vocabulary practice',
      type: 'exercise',
      content: `<h2>Vocabulary Practice</h2>
<p>Complete the following exercises to practice new vocabulary.</p>

<h3>Exercise 1: Translation</h3>
<p>Translate the following words from Tahitian to French:</p>
<ol>
  <li>Fare - ___________</li>
  <li>Vai - ___________</li>
  <li>Mahana - ___________</li>
</ol>

<h3>Exercise 2: Fill in the blanks</h3>
<p>Complete the sentences with the correct Tahitian words...</p>`
    },
    {
      id: 'cultural-story',
      name: 'Cultural Story',
      description: 'Template for cultural content',
      type: 'story',
      content: `<h2>Tahitian Legend</h2>
<p><em>A traditional story from Tahiti</em></p>

<p>Long ago in the beautiful islands of Tahiti...</p>

<h3>Vocabulary from the Story</h3>
<ul>
  <li><strong>Fenua</strong> - Land, island</li>
  <li><strong>Moana</strong> - Ocean, sea</li>
</ul>

<h3>Cultural Notes</h3>
<p>This story teaches us about...</p>`
    }
  ];

  const editor = useEditor({
    extensions: [StarterKit],
    content: initialContent,
    onUpdate: ({ editor }) => {
      const text = editor.getText();
      setWordCount(text.split(/\s+/).filter(word => word.length > 0).length);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[300px] p-4',
      },
    },
  });

  const insertTahitianCharacter = useCallback((character: string) => {
    if (editor) {
      editor.chain().focus().insertContent(character).run();
    }
  }, [editor]);

  const applyTemplate = useCallback((templateId: string) => {
    const template = contentTemplates.find(t => t.id === templateId);
    if (template && editor) {
      editor.chain().focus().setContent(template.content).run();
      toast.success(`Applied ${template.name} template`);
    }
  }, [editor]);

  const handleSave = useCallback(() => {
    if (editor && onSave) {
      const content = editor.getHTML();
      onSave(content);
      toast.success('Content saved successfully!');
    }
  }, [editor, onSave]);

  const handlePreview = useCallback(() => {
    if (editor && onPreview) {
      const content = editor.getHTML();
      onPreview(content);
      setIsPreviewMode(!isPreviewMode);
    }
  }, [editor, onPreview, isPreviewMode]);

  const handleAIContentGenerated = useCallback((content: string) => {
    if (editor) {
      editor.chain().focus().insertContent(content).run();
      toast.success('AI content inserted successfully!');
    }
  }, [editor]);

  const handleAISuggestion = useCallback((suggestion: string) => {
    if (editor) {
      const { from, to } = editor.state.selection;
      editor.chain().focus().insertContentAt({ from, to }, suggestion).run();
      toast.success('AI suggestion applied!');
    }
  }, [editor]);

  const formatText = useCallback((format: string) => {
    if (!editor) return;

    switch (format) {
      case 'bold':
        editor.chain().focus().toggleBold().run();
        break;
      case 'italic':
        editor.chain().focus().toggleItalic().run();
        break;
      case 'underline':
        editor.chain().focus().toggleUnderline().run();
        break;
      case 'strike':
        editor.chain().focus().toggleStrike().run();
        break;
      case 'code':
        editor.chain().focus().toggleCode().run();
        break;
      case 'h1':
        editor.chain().focus().toggleHeading({ level: 1 }).run();
        break;
      case 'h2':
        editor.chain().focus().toggleHeading({ level: 2 }).run();
        break;
      case 'h3':
        editor.chain().focus().toggleHeading({ level: 3 }).run();
        break;
      case 'bulletList':
        editor.chain().focus().toggleBulletList().run();
        break;
      case 'orderedList':
        editor.chain().focus().toggleOrderedList().run();
        break;
      case 'blockquote':
        editor.chain().focus().toggleBlockquote().run();
        break;
      case 'hr':
        editor.chain().focus().setHorizontalRule().run();
        break;
      case 'undo':
        editor.chain().focus().undo().run();
        break;
      case 'redo':
        editor.chain().focus().redo().run();
        break;
    }
  }, [editor]);

  if (!editor) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-blue-600" />
            Tahitian Rich Content Editor
          </h2>
          <p className="text-gray-600 mt-1">
            Create rich content with Tahitian language support
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePreview}>
            <Eye className="h-4 w-4 mr-2" />
            {isPreviewMode ? 'Edit' : 'Preview'}
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="editor" className="flex items-center gap-2">
            <Type className="h-4 w-4" />
            Editor
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            AI Assistant
          </TabsTrigger>
          <TabsTrigger value="characters" className="flex items-center gap-2">
            <Languages className="h-4 w-4" />
            Characters
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="tools" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Tools
          </TabsTrigger>
        </TabsList>

        {/* Editor Tab */}
        <TabsContent value="editor" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Content Editor</CardTitle>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>{wordCount} words</span>
                  <Badge variant="outline">
                    {editor.isActive('bold') && 'B '}
                    {editor.isActive('italic') && 'I '}
                    {editor.isActive('underline') && 'U '}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Toolbar */}
              <div className="flex flex-wrap gap-1 p-2 border rounded-lg bg-gray-50">
                {/* Text Formatting */}
                <div className="flex gap-1">
                  <Button
                    variant={editor.isActive('bold') ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => formatText('bold')}
                  >
                    <Bold className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={editor.isActive('italic') ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => formatText('italic')}
                  >
                    <Italic className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={editor.isActive('strike') ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => formatText('strike')}
                  >
                    <Strikethrough className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={editor.isActive('code') ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => formatText('code')}
                  >
                    <Code className="h-4 w-4" />
                  </Button>
                </div>

                <Separator orientation="vertical" className="h-8" />

                {/* Headings */}
                <div className="flex gap-1">
                  <Button
                    variant={editor.isActive('heading', { level: 1 }) ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => formatText('h1')}
                  >
                    <Heading1 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={editor.isActive('heading', { level: 2 }) ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => formatText('h2')}
                  >
                    <Heading2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={editor.isActive('heading', { level: 3 }) ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => formatText('h3')}
                  >
                    <Heading3 className="h-4 w-4" />
                  </Button>
                </div>

                <Separator orientation="vertical" className="h-8" />

                {/* Lists */}
                <div className="flex gap-1">
                  <Button
                    variant={editor.isActive('bulletList') ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => formatText('bulletList')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={editor.isActive('orderedList') ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => formatText('orderedList')}
                  >
                    <ListOrdered className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={editor.isActive('blockquote') ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => formatText('blockquote')}
                  >
                    <Quote className="h-4 w-4" />
                  </Button>
                </div>

                <Separator orientation="vertical" className="h-8" />

                {/* Media */}
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm">
                    <Image className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Video className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Mic className="h-4 w-4" />
                  </Button>
                </div>

                <Separator orientation="vertical" className="h-8" />

                {/* Undo/Redo */}
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => formatText('undo')}
                    disabled={!editor.can().undo()}
                  >
                    <Undo className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => formatText('redo')}
                    disabled={!editor.can().redo()}
                  >
                    <Redo className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Editor Content */}
              <div className="border rounded-lg min-h-[400px] bg-white relative">
                <EditorContent editor={editor} />
                <AITooltips 
                  content={editor?.getHTML() || ''}
                  onSuggestionApplied={handleAISuggestion}
                />
              </div>

              {/* Quick Tahitian Characters */}
              <div className="flex flex-wrap gap-2 p-3 bg-blue-50 rounded-lg">
                <span className="text-sm font-medium text-blue-800 mr-2">Quick Insert:</span>
                {tahitianCharacters.slice(0, 6).map((char) => (
                  <Button
                    key={char.character}
                    variant="outline"
                    size="sm"
                    onClick={() => insertTahitianCharacter(char.character)}
                    className="h-8 w-8 p-0 text-lg"
                    title={char.description}
                  >
                    {char.character}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab('characters')}
                  className="text-xs"
                >
                  More...
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Assistant Tab */}
        <TabsContent value="ai" className="space-y-4">
          <AIContentAssistant 
            onContentGenerated={handleAIContentGenerated}
            currentContent={editor?.getHTML() || ''}
          />
        </TabsContent>

        {/* Tahitian Characters Tab */}
        <TabsContent value="characters" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Languages className="h-5 w-5" />
                Tahitian Characters
              </CardTitle>
              <CardDescription>
                Insert special Tahitian characters and diacritical marks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Click on any character to insert it at your cursor position in the editor.
                </AlertDescription>
              </Alert>

              {/* Vowels with Macrons */}
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Badge variant="secondary">Vowels</Badge>
                  Long vowel sounds (macrons)
                </h4>
                <div className="grid grid-cols-6 gap-3">
                  {tahitianCharacters
                    .filter(char => char.category === 'vowel')
                    .map((char) => (
                      <Button
                        key={char.character}
                        variant="outline"
                        className="h-16 w-16 text-2xl flex flex-col items-center justify-center"
                        onClick={() => insertTahitianCharacter(char.character)}
                        title={char.description}
                      >
                        <span className="text-2xl">{char.character}</span>
                        <span className="text-xs text-gray-500">{char.name}</span>
                      </Button>
                    ))}
                </div>
              </div>

              {/* Special Characters */}
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Badge variant="secondary">Special</Badge>
                  Glottal stops and other marks
                </h4>
                <div className="grid grid-cols-6 gap-3">
                  {tahitianCharacters
                    .filter(char => char.category === 'special')
                    .map((char) => (
                      <Button
                        key={char.character}
                        variant="outline"
                        className="h-16 w-16 text-2xl flex flex-col items-center justify-center"
                        onClick={() => insertTahitianCharacter(char.character)}
                        title={char.description}
                      >
                        <span className="text-2xl">{char.character}</span>
                        <span className="text-xs text-gray-500">{char.name}</span>
                      </Button>
                    ))}
                </div>
              </div>

              {/* Common Combinations */}
              <div>
                <h4 className="font-medium mb-3">Common Word Patterns</h4>
                <div className="flex flex-wrap gap-2">
                  {['ia ora na', 'mauruuru', 'nana', 'tē', 'rā', 'mā'].map((pattern) => (
                    <Button
                      key={pattern}
                      variant="outline"
                      size="sm"
                      onClick={() => insertTahitianCharacter(pattern)}
                      className="text-sm"
                    >
                      {pattern}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Content Templates
              </CardTitle>
              <CardDescription>
                Start with pre-built templates for common content types
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {contentTemplates.map((template) => (
                  <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <Badge variant="outline">{template.type}</Badge>
                      </div>
                      <CardDescription className="text-sm">
                        {template.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <Button 
                        size="sm" 
                        className="w-full"
                        onClick={() => applyTemplate(template.id)}
                      >
                        <Sparkles className="h-3 w-3 mr-1" />
                        Use Template
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Note:</strong> Applying a template will replace your current content. 
                  Make sure to save your work first if needed.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tools Tab */}
        <TabsContent value="tools" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* AI Writing Assistant */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  AI Writing Assistant
                </CardTitle>
                <CardDescription>
                  Access advanced AI features for content creation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => setActiveTab('ai')}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Open AI Assistant
                </Button>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>• Generate lesson plans automatically</p>
                  <p>• Check Tahitian & French grammar</p>
                  <p>• Get cultural context explanations</p>
                  <p>• AI-powered content suggestions</p>
                </div>
              </CardContent>
            </Card>

            {/* Content Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Content Analysis
                </CardTitle>
                <CardDescription>
                  Analyze your content for quality and accessibility
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Readability Score</span>
                    <span className="font-medium">Good</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tahitian Content</span>
                    <span className="font-medium">45%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Learning Level</span>
                    <span className="font-medium">Beginner</span>
                  </div>
                </div>
                <Button className="w-full" variant="outline">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Run Full Analysis
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
});

export default TahitianRichEditor;