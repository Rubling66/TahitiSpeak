'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Alert, AlertDescription } from '@/components/ui/Alert';

interface ContentItem {
  id: string;
  title: string;
  type: 'lesson' | 'vocabulary' | 'cultural' | 'media';
  status: 'draft' | 'published' | 'archived';
  lastModified: string;
  author: string;
}

const ContentManagementHub: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Mock data - in real implementation, this would come from an API
  const [contentItems] = useState<ContentItem[]>([
    {
      id: '1',
      title: 'Basic Greetings in Tahitian',
      type: 'lesson',
      status: 'published',
      lastModified: '2024-01-15',
      author: 'Admin'
    },
    {
      id: '2',
      title: 'Traditional Dance Vocabulary',
      type: 'vocabulary',
      status: 'draft',
      lastModified: '2024-01-14',
      author: 'Content Creator'
    },
    {
      id: '3',
      title: 'Polynesian Cultural Practices',
      type: 'cultural',
      status: 'published',
      lastModified: '2024-01-13',
      author: 'Cultural Expert'
    }
  ]);

  const filteredItems = contentItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || item.type === selectedType;
    const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'lesson': return 'bg-blue-100 text-blue-800';
      case 'vocabulary': return 'bg-purple-100 text-purple-800';
      case 'cultural': return 'bg-orange-100 text-orange-800';
      case 'media': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Content Management</h1>
        <Button className="bg-blue-600 hover:bg-blue-700">
          Create New Content
        </Button>
      </div>

      <Alert>
        <AlertDescription>
          Manage all educational content including lessons, vocabulary, cultural information, and media assets.
        </AlertDescription>
      </Alert>

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Content
            </label>
            <Input
              type="text"
              placeholder="Search by title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content Type
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="lesson">Lessons</option>
              <option value="vocabulary">Vocabulary</option>
              <option value="cultural">Cultural</option>
              <option value="media">Media</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Content List */}
      <div className="space-y-4">
        {filteredItems.map((item) => (
          <Card key={item.id} className="p-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                  <Badge className={getTypeColor(item.type)}>
                    {item.type}
                  </Badge>
                  <Badge className={getStatusColor(item.status)}>
                    {item.status}
                  </Badge>
                </div>
                <div className="text-sm text-gray-600">
                  <span>Last modified: {item.lastModified}</span>
                  <span className="mx-2">•</span>
                  <span>Author: {item.author}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  Edit
                </Button>
                <Button variant="outline" size="sm">
                  Preview
                </Button>
                <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                  Delete
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-gray-500">No content items found matching your criteria.</p>
        </Card>
      )}
    </div>
  );
};

export default ContentManagementHub;