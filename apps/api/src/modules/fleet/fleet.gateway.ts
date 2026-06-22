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

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/fleet' })
export class FleetGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(FleetGateway.name);

  constructor(
    @Inject(REDIS_SUBSCRIBER) private redisSub: Redis,
    private fleetService: FleetService,
  ) {
    this.redisSub.subscribe(REDIS_CHANNELS.GPS_POSITION);
    this.redisSub.on('message', (_channel, message) => {
      const pos = JSON.parse(message);
      this.fleetService.storePosition(pos).catch((err) =>
        this.logger.error(`storePosition failed: ${err}`),
      );
      if (pos.organizationId) {
        this.server.to(`org:${pos.organizationId}`).emit('position', pos);
      }
    });
  }

  handleConnection(client: Socket) {
    this.logger.log(`WS connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`WS disconnected: ${client.id}`);
  }

  @SubscribeMessage('join')
  handleJoin(@ConnectedSocket() client: Socket, @MessageBody() data: { orgId: string }) {
    client.join(`org:${data.orgId}`);
  }
}
