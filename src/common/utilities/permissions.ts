import Discord from 'discord.js'
import { staff_roles } from '@root/config'

export function fetchPermissions(member: Discord.GuildMember): PermissionLevel {
    const highestStaffRole = member.roles.cache
        .map(role => staff_roles.find(staff_role => staff_role.id === role.id))
        .filter(staff_role => staff_role !== undefined)
        .sort((role_a, role_b) => role_b.access_level - role_a.access_level)
        .shift();
        if(!highestStaffRole) return PermissionLevel.Public;

        return highestStaffRole.access_level;
}

export function isDeveloper(member: Discord.GuildMember): boolean {
    const roles = member.roles.cache
    .map(role => staff_roles.find(staff_role => role.id === staff_role.id))
    .filter(staff_role => staff_role !== undefined)
    return roles.some(staff_role => staff_role.access_level === PermissionLevel.Dev);
}