import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Inject, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_SUBSCRIBER } from '../redis/redis.module';
import { REDIS_CHANNELS } from '@trackma/shared';
import { FleetService } from './fleet.service';
import { AlertEngineService } from '../alerts/alert-engine.service';
import { TripDetectorService } from '../trips/trip-detector.service';

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/fleet' })
export class FleetGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(FleetGateway.name);

  constructor(
    @Inject(REDIS_SUBSCRIBER) private redisSub: Redis,
    private fleetService: FleetService,
    private alertEngine: AlertEngineService,
    private tripDetector: TripDetectorService,
  ) {
    this.redisSub.subscribe(REDIS_CHANNELS.GPS_POSITION);
    this.redisSub.on(
      'message',
      (_channel, message) => void this.handlePosition(message),
    );
  }

  private async handlePosition(message: string): Promise<void> {
    const pos = JSON.parse(message);
    try {
      const vehicle = await this.fleetService.storePosition(pos);
      if (!vehicle || !pos.organizationId) return;

      this.server.to(`org:${pos.organizationId}`).emit('position', pos);

      const alert = await this.alertEngine.evaluate(
        pos,
        vehicle.id,
        pos.organizationId,
      );
      if (alert) {
        this.server.to(`org:${pos.organizationId}`).emit('alert', alert);
      }

      await this.tripDetector.process(pos, vehicle.id);
    } catch (err) {
      this.logger.error(`Position processing failed: ${err}`);
    }
  }

  handleConnection(client: Socket) {
    this.logger.log(`WS connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`WS disconnected: ${client.id}`);
  }

  @SubscribeMessage('join')
  handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { orgId: string },
  ) {
    client.join(`org:${data.orgId}`);
  }

  @SubscribeMessage('join-demo')
  handleJoinDemo(@ConnectedSocket() client: Socket) {
    client.join('demo');
  }
}
