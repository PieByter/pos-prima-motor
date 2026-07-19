export type NotificationType = 'info' | 'success' | 'warning' | 'error'

export type Notification = {
    id: number
    user_id: string
    title: string
    message: string
    type: NotificationType
    is_read: boolean
    link: string | null
    created_at: string
}

export type NotificationInsert = Omit<Notification, 'id' | 'created_at'>
export type NotificationUpdate = Partial<Pick<Notification, 'is_read'>>
