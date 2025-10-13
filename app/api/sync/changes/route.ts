import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface SyncChange {
  id: string;
  table: string;
  operation: 'create' | 'update' | 'delete';
  data: any;
  timestamp: number;
  version: number;
}

export async function GET(request: NextRequest) {
  try {
    // Verify JWT token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let userId: string;

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      userId = decoded.userId;
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const since = parseInt(searchParams.get('since') || '0');
    const limit = parseInt(searchParams.get('limit') || '100');
    const tables = searchParams.get('tables')?.split(',') || ['stories', 'lessons', 'user_progress'];

    const changes: SyncChange[] = [];

    // Get changes for each table
    for (const table of tables) {
      try {
        let query = supabase
          .from(table)
          .select('*')
          .gte('updated_at', new Date(since).toISOString())
          .order('updated_at', { ascending: true })
          .limit(limit);

        // Add user filter for user-specific data
        if (table === 'user_progress') {
          query = query.eq('user_id', userId);
        }

        const { data, error } = await query;

        if (error) {
          console.error(`Error fetching changes for ${table}:`, error);
          continue;
        }

        if (data) {
          for (const item of data) {
            // Determine operation type based on item state
            let operation: 'create' | 'update' | 'delete' = 'update';
            
            // Check if item was created recently (within sync window)
            const createdAt = new Date(item.created_at).getTime();
            if (createdAt > since) {
              operation = 'create';
            }

            // Check for soft deletes
            if (item.deleted_at) {
              operation = 'delete';
            }

            changes.push({
              id: item.id,
              table,
              operation,
              data: item,
              timestamp: new Date(item.updated_at).getTime(),
              version: item.version || 1,
            });
          }
        }
      } catch (error) {
        console.error(`Error processing table ${table}:`, error);
      }
    }

    // Sort changes by timestamp
    changes.sort((a, b) => a.timestamp - b.timestamp);

    // Get server timestamp for next sync
    const serverTimestamp = Date.now();

    return NextResponse.json({
      changes: changes.slice(0, limit),
      serverTimestamp,
      hasMore: changes.length >= limit,
    });

  } catch (error) {
    console.error('Sync changes error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify JWT token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let userId: string;

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      userId = decoded.userId;
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { changes } = body;

    if (!Array.isArray(changes)) {
      return NextResponse.json({ error: 'Invalid changes format' }, { status: 400 });
    }

    const results = [];
    const conflicts = [];

    // Process each change
    for (const change of changes) {
      try {
        const { table, operation, data, version } = change;

        // Validate table name
        if (!['stories', 'lessons', 'user_progress'].includes(table)) {
          results.push({
            id: change.id,
            success: false,
            error: 'Invalid table name',
          });
          continue;
        }

        // Add user context for user-specific data
        if (table === 'user_progress') {
          data.user_id = userId;
        }

        let result;

        switch (operation) {
          case 'create':
            // Check if item already exists
            const { data: existing } = await supabase
              .from(table)
              .select('id, version')
              .eq('id', data.id)
              .single();

            if (existing) {
              // Item already exists, treat as update
              result = await handleUpdate(table, data, version, existing);
            } else {
              // Create new item
              const { data: created, error } = await supabase
                .from(table)
                .insert({
                  ...data,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                  version: 1,
                })
                .select()
                .single();

              if (error) {
                throw error;
              }

              result = {
                id: data.id,
                success: true,
                data: created,
              };
            }
            break;

          case 'update':
            // Get current version
            const { data: current } = await supabase
              .from(table)
              .select('version, updated_at')
              .eq('id', data.id)
              .single();

            result = await handleUpdate(table, data, version, current);
            break;

          case 'delete':
            // Soft delete
            const { data: deleted, error: deleteError } = await supabase
              .from(table)
              .update({
                deleted_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                version: supabase.rpc('increment_version', { table_name: table, record_id: data.id }),
              })
              .eq('id', data.id)
              .select()
              .single();

            if (deleteError) {
              throw deleteError;
            }

            result = {
              id: data.id,
              success: true,
              data: deleted,
            };
            break;

          default:
            throw new Error(`Unknown operation: ${operation}`);
        }

        results.push(result);

        if (!result.success && result.conflict) {
          conflicts.push(result.conflict);
        }

      } catch (error) {
        results.push({
          id: change.id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      results,
      conflicts,
      serverTimestamp: Date.now(),
    });

  } catch (error) {
    console.error('Sync upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleUpdate(table: string, data: any, clientVersion: number, current: any) {
  if (!current) {
    return {
      id: data.id,
      success: false,
      error: 'Item not found',
    };
  }

  // Check for version conflict
  if (current.version && clientVersion && current.version !== clientVersion) {
    return {
      id: data.id,
      success: false,
      conflict: {
        id: data.id,
        table,
        localData: data,
        serverData: current,
        conflictType: 'version',
        timestamp: Date.now(),
      },
    };
  }

  // Check for timestamp conflict (if versions are the same but timestamps differ significantly)
  const currentTime = new Date(current.updated_at).getTime();
  const dataTime = new Date(data.updated_at || data.lastModified).getTime();
  const timeDiff = Math.abs(currentTime - dataTime);

  // If time difference is more than 1 minute, consider it a conflict
  if (timeDiff > 60000) {
    return {
      id: data.id,
      success: false,
      conflict: {
        id: data.id,
        table,
        localData: data,
        serverData: current,
        conflictType: 'timestamp',
        timestamp: Date.now(),
      },
    };
  }

  // Update the item
  const { data: updated, error } = await supabase
    .from(table)
    .update({
      ...data,
      updated_at: new Date().toISOString(),
      version: (current.version || 0) + 1,
    })
    .eq('id', data.id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return {
    id: data.id,
    success: true,
    data: updated,
  };
}