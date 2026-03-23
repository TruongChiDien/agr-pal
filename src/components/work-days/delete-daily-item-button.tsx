'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'

interface Props {
  id: string
  onDelete: (id: string) => Promise<any>
  title?: string
}

export function DeleteDailyItemButton({ id, onDelete, title }: Props) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  async function handleClick() {
    if (!confirm(title || 'Bạn có chắc muốn xóa?')) return
    setLoading(true)
    try {
      const result = await onDelete(id)
      if (result.success) {
        toast({ title: 'Xóa thành công' })
        router.refresh()
      } else {
        toast({ title: 'Lỗi', description: result.error, variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Lỗi', description: 'Đã xảy ra lỗi', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 text-muted-foreground hover:text-destructive"
      onClick={handleClick}
      disabled={loading}
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  )
}
