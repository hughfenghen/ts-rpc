/* eslint-disable */
type UnwrapPromise<T> = T extends Promise<infer U> ? U : T

export namespace fuxiNS {
  export interface App {
      AwardService: AwardService;
      BlsSpring2022Controller: BlsSpring2022Controller;
      DocContentController: DocContentController;
      GamePlatformJanuaryInitialService: GamePlatformJanuaryInitialService;
      SpringFestival2022Service: SpringFestival2022Service;
  }

export interface APIReturnTypes {
    'AwardService.getRewardConfigData': UnwrapPromise<WrapPromise<IServiceData<Partial<IGetRewardConfigDataFormated>>>> | { error: string }
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
   * ?????????????????????????????????????????????????????????
   */
  export type TtransFirstCharToLowercase<T extends string> = T extends `${infer A}${infer B}` ? `${Lowercase<A>}${B}` : T;
  /**
   * ??????????????????????????????????????????
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
   * ???????????????????????????????????????
   * e.g TTupleToUnionType<['a','b','c']> => 'a' | 'b' | 'c'
   */
  export type TTupleToUnionType<T> = T extends Array<infer P> ? P : never;
  /**
   * ????????????????????????????????????????????????????????????
   * e.g TStringToUnionType<'abc'> => 'a' | 'b' | 'c'
   */
  export type TStringToUnionType<T extends string> = TTupleToUnionType<TSplit<T, ''>>;
  /**
   * ???????????????????????????????????????
   */
  export type TIsUpperCase<T extends string> = T extends Lowercase<T> ? false : true;
  /**
   * ????????????????????????????????????????????????
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

  type WrapPromise<T> = Promise<T>

  interface AwardService {
      /**
       * ????????????????????????????????????
       *
       * @param {number} rewardId
       * @memberof AwesomeAward
       */
      getRewardConfigData(rewardId: number): WrapPromise<IServiceData<Partial<IGetRewardConfigDataFormated>>>;
  }

  interface BlsSpring2022Controller {
      /**
       * @api {get} fuxiRPC.BlsSpring2022Controller.getHalfInitial ???????????????
       * @apiVersion 0.0.1
       * @apiName ???????????????
       * @apiGroup BLS?????????
       * @apiParam {String} uid ??????uid
       * @apiParam {Number} roomId ?????????
       * @apiParam {String} actId ????????????id
       * @apiSuccessExample Success-Response:
       *    HTTP/2.0 200 OK
       *    {
       *      data: {
       *        subData: {
       *               tabJson: "",
       *               actStatus:0, // ???????????????1?????????????????????2???????????????
       *               teamId: 1,// ??????ID
       *               teamName:"??????",
       *               stage:1, // ??????, 1=????????????2=????????????3=??????
       *               stageName: "?????????",
       *               stageInfo:{ // ????????????????????????
       *                   isSettlement: "?????????????????? 0???1???",
       *                   isPromotion: "???????????? 0???1???",
       *               }
       *             },
       *             params: {
       *               rank_id: [0, 1],// ??????id
       *               have_diff:1,// ?????????????????????????????? 0??? 1???
       *               assist_num:1,// int32?????????????????? 0??????????????????
       *               sub_rank_id:0,// int32
       *               dimension_other:1// teamId
       *               promotion_rank: 5, //???N?????????
       *             }
       *             status: '';
       *             message: '';
       *             uface: '';
       *             uname: '';
       *             anchorFace: '';
       *             anchorName: '';
       *             currentActId: 0, //????????????ID
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
       * @api {get} fuxiRPC.BlsSpring2022Controller.getFullInitial ???????????????
       * @apiVersion 0.0.1
       * @apiName ???????????????
       * @apiGroup BLS?????????
       * @apiParam {Number} actId ??????id
       * @apiSuccessExample Success-Response:
       *    HTTP/2.0 200 OK
       *    {
       *      data: {
       *       subData: {
       *             tabJson: "",
       *             actStatus:0, // ???????????????1?????????????????????2???????????????
       *             stage:1, // ??????, 1=????????????2=????????????3=??????
       *             stageName: "?????????",
       *           },
       *           message: '';
       *           uface: '';
       *           uname: '';
       *           currentActId: 0, //????????????ID
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
       * @api {get} fuxiRPC.BlsSpring2022Controller.getTheRoadOfKnights ?????????????????????
       * @apiVersion 0.0.1
       * @apiName ???????????????
       * @apiGroup BLS?????????
       * @apiSuccessExample Success-Response:
       *    HTTP/2.0 200 OK
       *    {
       *      data: {
       *        userScore: 0, // ??????????????????
       *        userLevel: 0, // ?????????????????? ??????0
       *        nextLevelScore: 0, // 0??????????????????
       *        isReward: true, // ??????????????? true?????????
       *        levelInfo:[{
       *          level: 0, // ?????? ?????????0
       *          levelDesc: '', // ????????????
       *          levelScore: 0, // ??????????????????
       *          levelStatus: 0, // ?????????????????? 0????????? 1?????????
       *          levelRewards: [ // ????????????
       *            awardPic: '', // ????????????
       *            awardDesc: '', // ????????????
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
       * @api {get} fuxiRPC.BlsSpring2022.getKnightsAwards ?????????????????????
       * @apiVersion 0.0.1
       * @apiName ?????????????????????
       * @apiGroup BLS?????????
       * @apiSuccess {Number} statusCode ??????????????????0?????????????????????????????????
       * @apiSuccess {String} statusMessage ????????????
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
       * ??????????????????
       * @param {number} id
       */
      getDocContent(id: number): Promise<IServiceData<IContent<string>>>;
  }

  interface GamePlatformJanuaryInitialService {
      /**
       * ???????????????????????????
       *
       * @param {number} actId
       * @param {number} uid
       * @param {number} roomId
       * @memberof GamePlatformJanuaryInitialService
       */
      getHalfInitial(uid: string, roomId: number): Promise<IServiceData<Partial<IInitHalfGame>>>;
      /**
       * ???????????????????????????
       *
       * @param {number} actId
       * @memberof GamePlatformJanuaryInitialService
       */
      getFullInitial(): Promise<IServiceData<IInitFullGame>>;
  }

  interface SpringFestival2022Service {
      /**
       * ???????????????????????????
       *
       * @param {number} actId
       * @memberof SpringFestival2022Service
       */
      getFullInitial(actId?: number): Promise<IServiceData<Partial<ISpringFestival2022InitFull>>>;
      /**
       * ???????????????&??????????????????
       * @param {number} actId
       * @param {number} roomId
       * @param {number} uid
       */
      getHalfInitial(uid: string, roomId: number): Promise<IServiceData<Partial<THalfAll<ILotteryItem>>>>;
      /**
       * ??????
       * @param {number} uid
       * @param {string} roomId
       * @param {number} lotteryId
       * @param {number} lotteryNum
       */
      bet(date: string, lotteryId: number, lotteryNum: number): Promise<IServiceData<IBetStatus>>;
      getLotteryLog(page: number, pageSize: number): Promise<IServiceData<IGetLotteryLogDataFormated>>;
      /**
       * ????????????????????????
       */
      lotteryRecord(): Promise<IServiceData<ILotteryItem>>;
  }
}

export type fuxi = fuxiNS.App;