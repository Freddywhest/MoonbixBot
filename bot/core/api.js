const app = require("../config/app");
const logger = require("../utils/logger");
var _ = require("lodash");

class ApiRequest {
  constructor(session_name, bot_name) {
    this.session_name = session_name;
    this.bot_name = bot_name;
  }

  async get_access_token(http_client, request_data) {
    try {
      const response = await http_client.post(
        `${app.apiUrl}/bapi/growth/v1/friendly/growth-paas/third-party/access/accessToken`,
        JSON.stringify(request_data)
      );

      if (response?.data?.success === false) {
        logger.warning(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ⚠️ Error while getting access token: ${response?.data?.message} | Details: <la>${response?.data?.messageDetail}</la>`
        );
        return null;
      }

      return response?.data?.data;
    } catch (error) {
      if (error?.response?.data?.message) {
        logger.warning(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ⚠️ Error while getting access token: ${error?.response?.data?.message}`
        );
      } else {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while getting access token: ${error.message}`
        );
      }

      return null;
    }
  }

  async create_referral(http_client, resourceId) {
    try {
      const response = await http_client.post(
        `${app.apiUrl}/bapi/growth/v1/friendly/growth-paas/mini-app-activity/third-party/referral`,
        JSON.stringify({ resourceId, agentId: "1167045062" })
      );

      if (response?.data?.success === false) {
        logger.warning(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ⚠️ Error while creating referral: ${response?.data?.message} | Details: <la>${response?.data?.messageDetail}</la>`
        );
        return null;
      }

      return response?.data;
    } catch (error) {
      if (error?.response?.data?.message) {
        logger.warning(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ⚠️ Error while creating referral: ${error?.response?.data?.message}`
        );
      } else {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while creating referral: ${error.message}`
        );
      }

      return null;
    }
  }

  async participating(http_client, resourceId) {
    try {
      const response = await http_client.post(
        `${app.apiUrl}/bapi/growth/v1/friendly/growth-paas/mini-app-activity/third-party/game/participated`,
        JSON.stringify({ resourceId })
      );

      if (response?.data?.success === false) {
        logger.warning(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ⚠️ Error while participating: ${response?.data?.message} | Details: <la>${response?.data?.messageDetail}</la>`
        );
        return null;
      }

      return response?.data;
    } catch (error) {
      if (error?.response?.data?.message) {
        logger.warning(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ⚠️ Error while participating: ${error?.response?.data?.message}`
        );
      } else {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while participating: ${error.message}`
        );
      }

      return null;
    }
  }

  async validate_query_id(http_client, request_data) {
    try {
      const response = await http_client.post(
        `${app.apiUrl}/bapi/growth/v1/friendly/growth-paas/third-party/access/accessToken`,
        JSON.stringify(request_data)
      );

      if (
        !_.isEmpty(response?.data) &&
        response?.data?.success === true &&
        response?.data?.code === "000000"
      ) {
        return response.data?.data;
      }
      return false;
    } catch (error) {
      if (_.isEmpty(error?.response?.data) || error?.response?.status == 403) {
        return false;
      }

      throw error;
    }
  }

  async get_user_data(http_client, resourceId) {
    try {
      const response = await http_client.post(
        `${app.apiUrl}/bapi/growth/v1/friendly/growth-paas/mini-app-activity/third-party/user/user-info`,
        JSON.stringify({ resourceId })
      );

      if (response?.data?.success === false) {
        logger.warning(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ⚠️ Error while getting user data: ${response?.data?.message} | Details: <la>${response?.data?.messageDetail}</la>`
        );
        return null;
      }
      return response?.data?.data;
    } catch (error) {
      if (error?.response?.data?.message) {
        logger.warning(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ⚠️ Error while getting user data: ${error?.response?.data?.message}`
        );
      } else {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while getting user data: ${error.message}`
        );
      }
    }
  }

  async get_resource_single_data(http_client) {
    try {
      const request_data = { code: "moon-bix", type: "MINI_APP_ACTIVITY" };
      const response = await http_client.post(
        `${app.apiUrl}/bapi/growth/v1/public/growth-paas/resource/single`,
        JSON.stringify(request_data)
      );

      if (response?.data?.success === false) {
        logger.warning(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ⚠️ Error while getting resource single data: ${response?.data?.message} | Details: <la>${response?.data?.messageDetail}</la>`
        );
        return null;
      }
      return response?.data?.data;
    } catch (error) {
      if (error?.response?.data?.message) {
        logger.warning(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ⚠️ Error while getting resource single data: ${error?.response?.data?.message}`
        );
      } else {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while getting resource single data: ${error.message}`
        );
      }

      return null;
    }
  }

  async get_tasks_data(http_client, resourceId) {
    try {
      const response = await http_client.post(
        `${app.apiUrl}/bapi/growth/v1/friendly/growth-paas/mini-app-activity/third-party/task/list`,
        JSON.stringify({ resourceId })
      );

      if (response?.data?.success === false) {
        logger.warning(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ⚠️ Error while getting tasks data: ${response?.data?.message} | Details: <la>${response?.data?.messageDetail}</la>`
        );
        return null;
      }
      return response?.data?.data;
    } catch (error) {
      if (error?.response?.data?.message) {
        logger.warning(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ⚠️ Error while getting tasks data: ${error?.response?.data?.message}`
        );
      } else {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while getting tasks data: ${error.message}`
        );
      }

      return null;
    }
  }

  async claim_tasks(http_client, resourceId) {
    try {
      const response = await http_client.post(
        `${app.apiUrl}/bapi/growth/v1/friendly/growth-paas/mini-app-activity/third-party/task/complete`,
        JSON.stringify({ resourceIdList: [resourceId], referralCode: null })
      );

      if (response?.data?.success === false) {
        logger.warning(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ⚠️ Error while claiming tasks: ${response?.data?.message} | Details: <la>${response?.data?.messageDetail}</la>`
        );
        return null;
      }
      return response?.data?.data;
    } catch (error) {
      if (error?.response?.data?.message) {
        logger.warning(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ⚠️ Error while claiming tasks: ${error?.response?.data?.message}`
        );
      } else {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while claiming tasks: ${error.message}`
        );
      }

      return null;
    }
  }

  async start_game(http_client, resourceId) {
    try {
      const response = await http_client.post(
        `${app.apiUrl}/bapi/growth/v1/friendly/growth-paas/mini-app-activity/third-party/game/start`,
        JSON.stringify({ resourceId })
      );

      if (response?.data?.success === false) {
        logger.warning(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ⚠️ Error while starting game: ${response?.data?.message} | Details: <la>${response?.data?.messageDetail}</la>`
        );
        return null;
      }
      return response?.data?.data;
    } catch (error) {
      if (error?.response?.data?.message) {
        logger.warning(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ⚠️ Error while starting game: ${error?.response?.data?.message}`
        );
      } else {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while starting game: ${error.message}`
        );
      }

      return null;
    }
  }

  async complete_game(http_client, request_data) {
    try {
      const response = await http_client.post(
        `${app.apiUrl}/bapi/growth/v1/friendly/growth-paas/mini-app-activity/third-party/game/complete`,
        JSON.stringify(request_data)
      );

      if (response?.data?.success === false) {
        logger.warning(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ⚠️ Error while claiming game: ${response?.data?.message} | Details: <la>${response?.data?.messageDetail}</la>`
        );
        return null;
      }

      return response?.data;
    } catch (error) {
      if (error?.response?.data?.message) {
        logger.warning(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ⚠️ Error while claiming game: ${error?.response?.data?.message}`
        );
      } else {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while claiming game: ${error.message}`
        );
      }

      return null;
    }
  }

  async referral(http_client) {
    try {
      const response = await http_client.post(
        `${app.apiUrl}/bapi/growth/v1/friendly/growth-paas/mini-app-activity/third-party/referral`,
        JSON.stringify({ resourceId: 2056, agentId: "1167045062" })
      );

      if (response?.data?.success === false) {
        logger.warning(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ⚠️ Error while getting referral: ${response?.data?.message} | Details: <la>${response?.data?.messageDetail}</la>`
        );
        return null;
      }
      return response?.data?.data;
    } catch (error) {
      if (error?.response?.data?.message) {
        logger.warning(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ⚠️ Error while getting referral: ${error?.response?.data?.message}`
        );
      } else {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while getting referral: ${error.message}`
        );
      }

      return null;
    }
  }

  async check_eligibility(http_client) {
    try {
      const response = await http_client.post(
        `${app.apiUrl}/bapi/growth/v1/friendly/growth-paas/mini-app-activity/third-party/user/user-eligibility`,
        JSON.stringify({
          resourceId: 2056,
          orionBusinessTypeList: ["TG_mini_app_01"],
        })
      );

      if (response?.data?.success === false) {
        logger.warning(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ⚠️ Error while checking eligibility: ${response?.data?.message} | Details: <la>${response?.data?.messageDetail}</la>`
        );
        return null;
      }
      return response?.data?.data;
    } catch (error) {
      if (error?.response?.data?.message) {
        logger.warning(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ⚠️ Error while checking eligibility: ${error?.response?.data?.message}`
        );
      } else {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while checking eligibility: ${error.message}`
        );
      }

      return null;
    }
  }
}

module.exports = ApiRequest;
