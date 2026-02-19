type TenantLocation = {
    city?: string;
    country?: string;
} | null | undefined;

export function getTenantLocationDisplay(tenant: TenantLocation): string {
    if (!tenant) {
        return '';
    }

    const { city, country } = tenant;
    if (city && country) {
        return `${city}, ${country}`;
    }

    if (city) {
        return city;
    }

    if (country) {
        return country;
    }

    return '';
}

export function toggleEditState(event: Event, isEditing: boolean, onSave: () => void): boolean {
    event.stopPropagation();
    if (isEditing) {
        onSave();
    }
    return !isEditing;
}
