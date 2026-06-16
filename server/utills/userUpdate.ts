const AVATAR_REGEX = /^data:image\/(jpeg|png|webp|gif);base64,/;
const MAX_AVATAR_SIZE = 2 * 1024 * 1024

export const validateAvatar = (avatar: string | null | undefined): string | null => {
    if (!avatar) return null
    if (!AVATAR_REGEX.test(avatar)) {
        throw new Error("Invalid avatar format")
    }
    if (avatar.length > MAX_AVATAR_SIZE) {
        throw new Error("Avatar too large (max 2MB)")
    }
    return avatar
}

export const validateDisplayName = (name: string | null | undefined): string | null => {
    if (!name) return null
    const trimmed = name.trim();
    if (trimmed.length > 50) throw new Error("Display name too long (max 50)");
    return trimmed
}