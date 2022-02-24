/* eslint-disable */
export namespace fuxiNS {
  export interface App {
      AwardService: AwardService;
      BlsSpring2022Controller: BlsSpring2022Controller;
      DocContentController: DocContentController;
      GamePlatformJanuaryInitialService: GamePlatformJanuaryInitialService;
      SpringFestival2022Service: SpringFestival2022Service;
  }

  export interface ILotteryLogListItem {
      uname: string;
      award_num: number;
      award_name: number;
      award_img: string;
      timestamp: number;
  }

  export interface IGetLotteryLogData {
      list: ILotteryLogListItem[];
      total_count: number;
  }

  export type IGetLotteryLogDataFormated = TKeysToCamelCase<IGetLotteryLogData>;

  export interface IBetStatus {
      status: number;
      msg: string;
  }

  export type THalfParams = string;

  export interface ISubData {
      teamName: string;
      teamId: number;
      tabJson: any;
      isShowCoupon: boolean;
      queryData?: {
          text: string
          timestamp: number
          }[];
  }

  export type TInitHalf = TKeysToCamelCase<IInitHalfBase<ISubData, THalfParams>>;

  export interface IHalfInitialRespData<T> {
      lotteryItems: T[];
      currentActId: number;
      timestamp: number;
  }

  export type THalfAll<T> = IHalfInitialRespData<T> & TInitHalf;

  export interface ILotteryItem {
      lotteryCount: number;
      currentStatus: number;
      awardNum: number;
      awardName: string;
      awardImg: string;
      date: string;
      lotteryId: number;
      awardPkgName: string;
      awardPkgNum: number;
      timeStatus: number;
  }

  export interface ISpringFestival2022FullSubData {
      query_date?: { text: string; timestamp: number }[];
      team_name: string;
      team_id: string;
      tab_json: any;
  }

  export interface ISpringFestival2022InitFullOrigin {
      timestamp: number;
      sub_data: ISpringFestival2022FullSubData;
      lotteryItems: ILotteryItem[];
      currentActId: number;
      message: string;
      uface: string;
      uname: string;
  }

  export type ISpringFestival2022InitFull = TKeysToCamelCase<ISpringFestival2022InitFullOrigin>;

  export interface IFullSubData {
      stage: number;
      stage_name: string;
      current_timestamp: string;
      tab_json: string;
  }

  export interface IInitFullBase<S> {
      sub_data: S;
      message: string;
      uface: string;
      uname: string;
  }

  export type IInitFullGame = TKeysToCamelCase<IInitFullBase<IFullSubData>>;

  export interface IHalfParams {
      rank_id?: number;
      have_diff?: number;
      assist_num?: number;
      sub_rank_id?: number;
      dimension_other?: string;
  }

  export interface IHalfSubTaskListItem {
      task_name: string;
      task_status: number;
      current_val: string;
      target_val: string;
  }

  export interface IHalfSubData {
      stage: number;
      stage_name: string;
      is_settlement: number;
      current_timestamp: string;
      team_id: string;
      team_name: string;
      task_list: IHalfSubTaskListItem[];
      tab_json: string;
  }

  export type IInitHalfGame = TKeysToCamelCase<
        IInitHalfBase<IHalfSubData, IHalfParams>
      >;

  export interface IContent<T> {
      content: T;
  }

  export interface IGetKnightAward {
      statusCode: number;
      statusMessage: string;
  }

  export interface ILevelRewards {
      awardPic: string;
      awardDesc: string;
  }

  export interface ITheRoadOfKnights {
      userScore: number;
      userLevel: number;
      nextLevelScore: number;
      reward: boolean;
      countdown: number;
      levelInfo: ILevelRewards[];
  }

  export interface IBlsSpring2022FullInit {
      subData: Pick<
          IBlsSpring2022HalfInitSubData,
          'tabJson' | 'stageId' | 'stageName' | 'actStatus'
          >;
      message: string;
      uface: string;
      uname: string;
      currentActId: number;
      timestamp: number;
  }

  export type TBlsSpringHalfParams = string;

  export interface IBlsSpring2022HalfInitSubData {
      tabJson: string;
      actStatus: number;
      teamId: number;
      teamName: string;
      stageId: number;
      stageName: string;
      stageInfo: {
          isSettlement: boolean
          isPromotion: boolean
          };
      timestamp: number;
      currentActId: number;
  }

  export interface IInitHalfBase<S, P> {
      params: P;
      status: string;
      message: string;
      uface: string;
      uname: string;
      anchor_face: string;
      anchor_name: string;
      sub_data: S;
  }

  export type TBlsSpring2022HalfInit = TKeysToCamelCase<
        IInitHalfBase<IBlsSpring2022HalfInitSubData, TBlsSpringHalfParams>
      >;

  export interface IBaseAwardData {
      front_award_img: string;
      front_award_name: string;
      front_award_desc: string;
  }

  export interface IPackageListItem {
      tab_name: string;
      rewardTitle: string;
      anchor_award_title: string;
      anchor_award_list: IBaseAwardData[];
      user_award_title: string;
      user_award_list: IBaseAwardData[];
  }

  export type TPackageListItemFormated = Omit<IPackageListItem, 'tab_name'>;

  export interface IRewardListItemFormated {
      reward_title: string;
      package_list: TPackageListItemFormated[];
  }

  /**
   * 将一个字符串类型中的第一个字符转为小写
   */
  export type TtransFirstCharToLowercase<T extends string> = T extends `${infer A}${infer B}` ? `${Lowercase<A>}${B}` : T;
  /**
   * 将一个字符串类型转为元组类型
   * e.g TSplit<'abc',''> => ['a', 'b', 'c']
   * https://github.com/microsoft/TypeScript/pull/40336?from=groupmessage
   */
  export type TSplit<S extends string, D extends string> = string extends S
        ? string[]
        : S extends ''
        ? []
        : S extends `${infer T}${D}${infer U}`
        ? [T, ...TSplit<U, D>]
        : [S];
  /**
   * 将一个元祖类型转成联合类型
   * e.g TTupleToUnionType<['a','b','c']> => 'a' | 'b' | 'c'
   */
  export type TTupleToUnionType<T> = T extends Array<infer P> ? P : never;
  /**
   * 将一个字符串类型的每一个字符转成联合类型
   * e.g TStringToUnionType<'abc'> => 'a' | 'b' | 'c'
   */
  export type TStringToUnionType<T extends string> = TTupleToUnionType<TSplit<T, ''>>;
  /**
   * 判断一个字符是否是大写字母
   */
  export type TIsUpperCase<T extends string> = T extends Lowercase<T> ? false : true;
  /**
   * 判断一个字符串中是否包含大写字母
   */
  export type TIsAnUpperCaseCharInString<T extends string> = boolean extends TIsUpperCase<TStringToUnionType<T>> ? true : false;
  /** key to camelCase global typing */
  export type TCamelCase<S extends string> = S extends `${infer P1}_${infer P2}${infer P3}`
          ? `${Lowercase<P1>}${Uppercase<P2>}${TCamelCase<P3>}`
          : TIsAnUpperCaseCharInString<S> extends true
          ? TtransFirstCharToLowercase<S>
          : S;
  export type CheckUnknown<T> = unknown extends T ? true : false;
  export type CheckNever<T> = T extends never ? true : false;
  export type CheckAny<T> = boolean extends CheckNever<T> ? true : false;
  export type TKeysToCamelCase<T> = CheckAny<T> extends true
        ? any
        : CheckUnknown<T> extends true
        ? unknown
        : T extends Function
        ? T
        : T extends Array<infer R>
        ? Array<TKeysToCamelCase<R>>
        : {
            [K in keyof T as TCamelCase<string & K>]: TKeysToCamelCase<T[K]>
          };
  export type IGetRewardConfigDataFormated = TKeysToCamelCase<{
        reward_list: IRewardListItemFormated[]
      }>;

  export interface IServiceData<T> {
      code: number;
      message?: string;
      data: T;
  }

  interface AwardService {
      /**
       * 获取奖励组件奖励信息数据
       *
       * @param {number} rewardId
       * @memberof AwesomeAward
       */
      getRewardConfigData(rewardId: number): Promise<IServiceData<Partial<IGetRewardConfigDataFormated>>>;
  }

  interface BlsSpring2022Controller {
      /**
       * @api {get} fuxiRPC.BlsSpring2022Controller.getHalfInitial 半屏初始化
       * @apiVersion 0.0.1
       * @apiName 半屏初始化
       * @apiGroup BLS春季赛
       * @apiParam {String} uid 用户uid
       * @apiParam {Number} roomId 房间号
       * @apiParam {String} actId 当前活动id
       * @apiSuccessExample Success-Response:
       *    HTTP/2.0 200 OK
       *    {
       *      data: {
       *        subData: {
       *               tabJson: "",
       *               actStatus:0, // 活动状态；1：活动进行中；2：活动结束
       *               teamId: 1,// 队伍ID
       *               teamName:"赛道",
       *               stage:1, // 阶段, 1=资格赛，2=晋级赛，3=决赛
       *               stageName: "资格赛",
       *               stageInfo:{ // 用于半屏信息展示
       *                   isSettlement: "是否为结算中 0否1是",
       *                   isPromotion: "是否晋级 0否1是",
       *               }
       *             },
       *             params: {
       *               rank_id: [0, 1],// 榜单id
       *               have_diff:1,// 是否查距离前后名积分 0否 1是
       *               assist_num:1,// int32查询应援数量 0表示不查应援
       *               sub_rank_id:0,// int32
       *               dimension_other:1// teamId
       *               promotion_rank: 5, //满N级晋级
       *             }
       *             status: '';
       *             message: '';
       *             uface: '';
       *             uname: '';
       *             anchorFace: '';
       *             anchorName: '';
       *             currentActId: 0, //当前活动ID
       *      },
       *      message: '' ,
       *      code: 200
       *    }
       * @apiErrorExample Error-Response:
       *    HTTP/2.0 500 Error
       *    {
       *       data: {},
       *       message: '',
       *       code: 500
       *    }
       */
      getHalfInitial(uid: string, roomId: string, actId: number): Promise<IServiceData<TBlsSpring2022HalfInit>>;
      /**
       * @api {get} fuxiRPC.BlsSpring2022Controller.getFullInitial 全屏初始化
       * @apiVersion 0.0.1
       * @apiName 全屏初始化
       * @apiGroup BLS春季赛
       * @apiParam {Number} actId 活动id
       * @apiSuccessExample Success-Response:
       *    HTTP/2.0 200 OK
       *    {
       *      data: {
       *       subData: {
       *             tabJson: "",
       *             actStatus:0, // 活动状态；1：活动进行中；2：活动结束
       *             stage:1, // 阶段, 1=资格赛，2=晋级赛，3=决赛
       *             stageName: "资格赛",
       *           },
       *           message: '';
       *           uface: '';
       *           uname: '';
       *           currentActId: 0, //当前活动ID
       *      },
       *      message: "",
       *      status: 200
       *    }
       * @apiErrorExample Error-Response:
       *    Http/2.0 500 Error
       *    {
       *       data: ,
       *       message: ,
       *       status:
       *    }
       */
      getFullInitial(actId: number): Promise<IServiceData<IBlsSpring2022FullInit>>;
      getIndexV4(): Promise<void>;
      /**
       * @api {get} fuxiRPC.BlsSpring2022Controller.getTheRoadOfKnights 获取骑士团信息
       * @apiVersion 0.0.1
       * @apiName 骑士团信息
       * @apiGroup BLS春季赛
       * @apiSuccessExample Success-Response:
       *    HTTP/2.0 200 OK
       *    {
       *      data: {
       *        userScore: 0, // 当前用户积分
       *        userLevel: 0, // 当前用户等级 默认0
       *        nextLevelScore: 0, // 0表示全部达成
       *        isReward: true, // 是否有奖励 true代表是
       *        levelInfo:[{
       *          level: 0, // 等级 初始为0
       *          levelDesc: '', // 等级描述
       *          levelScore: 0, // 等级达成积分
       *          levelStatus: 0, // 等级达成状态 0未达成 1已达成
       *          levelRewards: [ // 等级奖励
       *            awardPic: '', // 奖励图片
       *            awardDesc: '', // 奖励描述
       *          ]
       *        }]
       *      },
       *      message: 'ok',
       *      code: 200
       *    }
       * @apiErrorExample Error-Response:
       *    Http/2.0 500 Error
       *    {
       *       data: {},
       *       message: 'error',
       *       code: 500
       *    }
       */
      getTheRoadOfKnights(): Promise<IServiceData<ITheRoadOfKnights>>;
      /**
       * @api {get} fuxiRPC.BlsSpring2022.getKnightsAwards 领取骑士团奖励
       * @apiVersion 0.0.1
       * @apiName 领取骑士团奖励
       * @apiGroup BLS春季赛
       * @apiSuccess {Number} statusCode 领奖状态码，0代表成功，其他代表失败
       * @apiSuccess {String} statusMessage 失败信息
       * @apiSuccessExample Success-Response:
       *    HTTP/2.0 200 OK
       *    {
       *      data: {
       *         statusCode: 0,
       *         statusMessage: 0
       *      },
       *      message: 'ok',
       *      code: 0
       *    }
       * @apiErrorExample Error-Response:
       *    Http/2.0 500 Error
       *    {
       *       data: {},
       *       message: 'error' ,
       *       code: 500
       *    }
       */
      getKnightsAwards(): Promise<IServiceData<IGetKnightAward>>;
  }

  interface DocContentController {
      /**
       * 获取规则文案
       * @param {number} id
       */
      getDocContent(id: number): Promise<IServiceData<IContent<string>>>;
  }

  interface GamePlatformJanuaryInitialService {
      /**
       * 获取半屏初始化数据
       *
       * @param {number} actId
       * @param {number} uid
       * @param {number} roomId
       * @memberof GamePlatformJanuaryInitialService
       */
      getHalfInitial(uid: string, roomId: number): Promise<IServiceData<Partial<IInitHalfGame>>>;
      /**
       * 获取全屏初始化数据
       *
       * @param {number} actId
       * @memberof GamePlatformJanuaryInitialService
       */
      getFullInitial(): Promise<IServiceData<IInitFullGame>>;
  }

  interface SpringFestival2022Service {
      /**
       * 获取全屏初始化数据
       *
       * @param {number} actId
       * @memberof SpringFestival2022Service
       */
      getFullInitial(actId?: number): Promise<IServiceData<Partial<ISpringFestival2022InitFull>>>;
      /**
       * 半屏初始化&聚合接口数据
       * @param {number} actId
       * @param {number} roomId
       * @param {number} uid
       */
      getHalfInitial(uid: string, roomId: number): Promise<IServiceData<Partial<THalfAll<ILotteryItem>>>>;
      /**
       * 押注
       * @param {number} uid
       * @param {string} roomId
       * @param {number} lotteryId
       * @param {number} lotteryNum
       */
      bet(date: string, lotteryId: number, lotteryNum: number): Promise<IServiceData<IBetStatus>>;
      getLotteryLog(page: number, pageSize: number): Promise<IServiceData<IGetLotteryLogDataFormated>>;
      /**
       * 单独抽奖记录接口
       */
      lotteryRecord(): Promise<IServiceData<ILotteryItem>>;
  }
}

export type fuxi = fuxiNS.App;