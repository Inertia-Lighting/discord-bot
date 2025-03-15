const config = {
  guild_id: '601889649601806336',
  staff_guild_id: '1137873524208439326',

  // Bot Channels
  suggestions_category_id: '832009347818061904',
  support_information_channel_id: '814197612491833354',
  support_tickets_category_id: '805191315947913236',
  support_tickets_transcripts_channel_id: '806602125610057729',
  logging_channel_id: '602338824042971157',
  logging_user_retention_channel_id: '601890026095247381',
  logging_products_manager_channel_id: '990664646266601523',
  logging_identity_manager_channel_id: '1135380929532133426',
  info_channel_id: '737156807910359091',
  news_channel_id: '854442081899642950',
  general_channel_id: '601890659439476766',

  // Bot Staff Roles
  staff_role_id: { id: '789342326978772992', access_level: PermissionLevel.Staff },
  customer_service_role_id: { id: '1111047755746521253', access_level: PermissionLevel.CustomerService },
  lead_developer_role_id: { id: '805565232537534464', access_level: PermissionLevel.SeniorDev },
  developer_role_id: { id: '601890527276957726', access_level: PermissionLevel.Dev },
  moderator_role_id: { id: '601891791624470557', access_level: PermissionLevel.Moderators },
  admin_role_id: { id: '601890116344217651', access_level: PermissionLevel.Admins },
  team_leaders_role_id: { id: '844606847469748224', access_level: PermissionLevel.TeamLeaders },
  company_management_role_id: { id: '875543659624407100', access_level: PermissionLevel.CompanyManagement },

  // Bot Support Staff Roles
  support_staff_database_role_id: '807385028568154113',
  support_staff_product_purchases_role_id: '809151858253103186',
  support_staff_product_issues_role_id: '807385031051575306',
  support_staff_partnership_requests_role_id: '807385032754462761',
  support_staff_other_role_id: '809151496490057728',

  // Bot Product Roles
  staff_products_role_id: '1117587221327908964',
  subscriptions_tier_1_role_id: '1044113688187129978',
  partners_role_id: '641609935326543892',

  // Mongo DB Settings
  mongo_database_name: 'Inertia',
  mongo_users_collection_name: 'users',
  mongo_products_collection_name: 'products',
  mongo_blacklisted_users_collection_name: 'blacklisted-user-records',
  mongo_moderation_action_records_collection_name: 'moderation-action-records',
  mongo_quick_support_topics_collection_name: 'quick-support-topics',
  mongo_user_notes_collection_name: 'user-notes',
};

export const staff_roles: StaffRole[] = [
  config.staff_role_id,
  config.customer_service_role_id,
  config.developer_role_id,
  config.moderator_role_id,
  config.admin_role_id,
  config.team_leaders_role_id,
  config.company_management_role_id
]

export default config;